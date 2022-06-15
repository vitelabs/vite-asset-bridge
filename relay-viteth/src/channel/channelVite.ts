// ---------
// ---------
import * as utils from "../utils/utils";
import { ViteAPI, abi as abiUtils } from "@vite/vitejs";
const { HTTP_RPC } = require("@vite/vitejs-http");
import { wallet, accountBlock } from "@vite/vitejs";
import { constant } from "@vite/vitejs";
import _viteAbi from "./channel.vite.abi.json";
import { offChainCode } from "./channel.vite.code.json";
import { decodeLog } from "@vite/vitejs/distSrc/abi";
import { InputEvent, LogEvent, SenderMeta, StoredLogIndex } from "./common";
interface ConfirmedInfo {
  scannedHeight: string;
  index: string;
}

export interface ViteInputEvent extends InputEvent {
  accountBlockHash: string;
}

export interface ViteProvedEvent extends LogEvent {
  channelId: string;
  inputHash: string;
  sigR: string;
  sigS: string;
  sigV: number;
}

interface ViteLogEvent {
  height: number;
  hash: string;
  args: any;
}

const VITE_INFO_PATH_PREFIX = ".channel_vite/info";

export class ChannelVite {
  infoPath: string;

  viteProvider: any;
  viteChannelAddress: string;

  viteChannelAbi: any[];
  viteOffChainCode: any;

  signerAddress: string;
  signerPrivateKey: string;

  confirmedThreshold: number;

  keeperId: number;

  constructor(cfg: any, dataDir: string) {
    this.viteChannelAbi = _viteAbi;
    this.viteOffChainCode = Buffer.from(offChainCode, "hex").toString("base64");
    if (dataDir) {
      this.infoPath = dataDir + "/" + VITE_INFO_PATH_PREFIX;
    } else {
      this.infoPath = VITE_INFO_PATH_PREFIX;
    }
    this.viteProvider = new ViteAPI(new HTTP_RPC(cfg.url), () => {
      console.log("vite provider connected");
    });
    this.viteChannelAddress = cfg.address;
    const viteWallet = wallet.getWallet(cfg.account.mnemonic);
    const viteSigner = viteWallet.deriveAddress(cfg.account.index);
    this.signerAddress = viteSigner.address;
    this.signerPrivateKey = viteSigner.privateKey;
    this.confirmedThreshold = cfg.confirmedThreshold;
    this.keeperId = cfg.keeperId;
  }

  getInfo(prefix: string): any {
    let json = utils.readJson(this.infoPath + prefix);
    if (!json) {
      return json;
    }
    let info = JSON.parse(json);
    return info;
  }

  private updateInfo(prefix: string, info: any) {
    utils.writeJson(this.infoPath + prefix, JSON.stringify(info));
  }

  saveConfirmedInputs(storedIndex: StoredLogIndex) {
    this.updateInfo("_confirmed", storedIndex);
  }
  saveSubmitInputs(storedIndex: StoredLogIndex) {
    this.updateInfo("_submit", storedIndex);
  }

  saveSenderMeta(senderMeta: SenderMeta) {
    this.updateInfo("_senderMeta", senderMeta);
  }

  saveAddrNonceTx(nonce:number, tx: any) {
    this.updateInfo("_addr_"+nonce, tx);
  }

  async scanInputEvents(fromHeight: number): Promise<{
    toHeight: number;
    events: ViteInputEvent[];
  }> {
    // console.log("vite", "scan input events", fromHeight);
    const { toHeight, events } = await this.scanEvents(fromHeight, "Input");
    if (events && events.length > 0) {
      return {
        toHeight,
        events: events.map((event: ViteLogEvent) => {
          return {
            height: event.height,
            txIndex: -1,
            logIndex: -1,
            channelId: event.args.channelId.toString(),
            index: +event.args.index.toString(),
            inputHash: event.args.inputHash,
            dest: event.args.dest,
            value: event.args.value.toString(),
            accountBlockHash: event.hash,
          };
        }),
      };
    }
    return { toHeight, events: [] };
  }

  async scanInputProvedEvents(fromHeight: number): Promise<{
    toHeight: number;
    events: ViteProvedEvent[];
  }> {
    console.log("vite", "scan proved events", fromHeight);
    const { toHeight, events } = await this.scanEvents(
      fromHeight,
      "InputProved"
    );
    if (events && events.length > 0) {
      return {
        toHeight,
        events: events.map((event: ViteLogEvent) => {
          return {
            height: event.height,
            txIndex: -1,
            logIndex: -1,
            channelId: event.args.channelId.toString(),
            inputHash: event.args.inputHash,
            sigR: event.args.sigR,
            sigS: event.args.sigS,
            sigV: event.args.sigV,
          };
        }),
      };
    }
    return { toHeight, events: [] };
  }

  async scanEvents(
    fromHeight: number,
    eventName: string
  ): Promise<{
    toHeight: number;
    events: ViteLogEvent[];
  }> {
    const channelAddress = this.viteChannelAddress;
    let heightRange = {
      [channelAddress]: {
        fromHeight: (BigInt(fromHeight) + 1n).toString(),
        toHeight: "0",
      },
    };
    // console.log(JSON.stringify(heightRange));
    const vmLogs = await this.viteProvider.request("ledger_getVmLogsByFilter", {
      addressHeightRange: heightRange,
    });

    if (!vmLogs) {
      return {
        toHeight: fromHeight,
        events: [],
      };
    }
    const eventAbi = this.viteChannelAbi.find(
      (item: { name: string; type: string }) =>
        item.type === "event" && item.name === eventName
    );

    const events = vmLogs.filter((x: any) => {
      return this.encodeLogId(eventAbi) === x.vmlog.topics[0];
    });

    if (!events || events.length === 0) {
      return { toHeight: fromHeight, events: [] };
    }

    return {
      toHeight: fromHeight,
      events: events.map((input: any) => {
        const event: any = this.decodeEvent(
          input.vmlog,
          this.viteChannelAbi,
          eventName
        );
        return {
          args: event,
          height: input.accountBlockHeight,
          hash: input.accountBlockHash,
        };
      }),
    };
  }

  // filterInputLog(
  //   log: any,
  //   channelAbi: Array<{ name: string; type: string; }>,
  //   name: string
  // ) {

  //   const targetAbi = channelAbi.find(
  //     (item) => item.type === "event" && item.name === name
  //   );

  //   log.topics[0] ==
  //   const result = abi.decodeLog(
  //     channelAbi,
  //     Buffer.from(log.data ? log.data : "", "base64").toString("hex"),
  //     log.topics.slice(1, log.topics.length),
  //     ""
  //   );
  // }
  decodeEvent(
    log: any,
    channelAbi: Array<{ name: string; type: string }>,
    name: string
  ) {
    const result = abiUtils.decodeLog(
      channelAbi,
      Buffer.from(log.data ? log.data : "", "base64").toString("hex"),
      log.topics.slice(1, log.topics.length),
      name
    );
    return Object.assign(result, { name: name });
  }

  decodeLog(log: any, channelAbi: Array<{ name: string; type: string }>) {
    // console.log(JSON.stringify(log));
    // console.log(JSON.stringify(channelAbi));
    // console.log(log, log['topics'], log['topics'][0]);
    const abiItem = channelAbi.find(
      (item) => this.encodeLogId(item) === log.topics[0]
    );

    // console.log(abiItem);
    const result = abiUtils.decodeLog(
      channelAbi,
      Buffer.from(log.data ? log.data : "", "base64").toString("hex"),
      log.topics.slice(1, log.topics.length),
      abiItem?.name
    );
    return Object.assign(result, { name: abiItem?.name });
  }

  encodeLogId(item: { name: string; type: string }) {
    let id = "";
    if (item.type === "function") {
      id = abiUtils.encodeFunctionSignature(item);
    } else if (item.type === "event") {
      id = abiUtils.encodeLogSignature(item);
    }
    return id;
  }

  async output(id: string, address: string, value: string) {
    const sendResult = await writeContract(
      this.viteProvider,
      this.signerAddress,
      this.signerPrivateKey,
      this.viteChannelAddress,
      this.viteChannelAbi,
      "output",
      [id, address, value]
    );
  }

  async approveOutput(id: string) {
    const sendResult = await writeContract(
      this.viteProvider,
      this.signerAddress,
      this.signerPrivateKey,
      this.viteChannelAddress,
      this.viteChannelAbi,
      "approveOutput",
      [id]
    );
  }

  async approveAndExecOutput(
    keeperId: number,
    channelId: string,
    id: string,
    dest: string,
    value: string
  ) {
    const sendResult = await writeContract(
      this.viteProvider,
      this.signerAddress,
      this.signerPrivateKey,
      this.viteChannelAddress,
      this.viteChannelAbi,
      "approveAndExecOutput",
      [keeperId, channelId, id, dest, value]
    );
  }

  async proveInputHash(
    v: number,
    r: string,
    s: string,
    id: string,
    channelId: string
  ) {
    const sendResult = await writeContract(
      this.viteProvider,
      this.signerAddress,
      this.signerPrivateKey,
      this.viteChannelAddress,
      this.viteChannelAbi,
      "proveInputHash",
      [v, r, s, id, channelId]
    );
  }

  async prevInputId(channelId: string) {
    const channel = await readContract(
      this.viteProvider,
      this.viteChannelAddress,
      this.viteChannelAbi,
      this.viteOffChainCode,
      "channels",
      [channelId]
    );

    if (!channel) {
      return null;
    } else {
      return channel[0];
    }
  }

  async outputIndex(channelId: string) {
    const channel = await readContract(
      this.viteProvider,
      this.viteChannelAddress,
      this.viteChannelAbi,
      this.viteOffChainCode,
      "channels",
      [channelId]
    );

    if (!channel) {
      return null;
    } else {
      return channel[2];
    }
  }
  async prevOutputHash(channelId: string) {
    const channel = await readContract(
      this.viteProvider,
      this.viteChannelAddress,
      this.viteChannelAbi,
      this.viteOffChainCode,
      "channels",
      [channelId]
    );

    if (!channel) {
      return null;
    } else {
      return channel[3];
    }
  }

  async approvedCnt(id: string) {
    return readContract(
      this.viteProvider,
      this.viteChannelAddress,
      this.viteChannelAbi,
      this.viteOffChainCode,
      "approvedCnt",
      [id]
    );
  }
  async approvedKeepers(id: string, address: string) {
    return readContract(
      this.viteProvider,
      this.viteChannelAddress,
      this.viteChannelAbi,
      this.viteOffChainCode,
      "approvedKeepers",
      [id, address]
    );
  }
  async inputProvedKeepers(id: string, address: string) {
    return readContract(
      this.viteProvider,
      this.viteChannelAddress,
      this.viteChannelAbi,
      this.viteOffChainCode,
      "inputProvedKeepers",
      [id, address]
    );
  }
  async outputProvedKeepers(
    keeperId: number,
    outputHash: string,
    address: string
  ) {
    const result = await readContract(
      this.viteProvider,
      this.viteChannelAddress,
      this.viteChannelAbi,
      this.viteOffChainCode,
      "outputApproved",
      [keeperId, outputHash, address]
    );
    if (!result) {
      return undefined;
    }
    return +result[0] === 1;
  }
}

async function writeContract(
  provider: any,
  from: string,
  signerKey: string,
  to: string,
  abi: Array<{ name: string; type: string }>,
  methodName: string,
  params: any[]
) {
  const tokenId = constant.Vite_TokenId;
  const amount = "0";

  const methodAbi = abi.find((x) => {
    return x.name === methodName && x.type === "function";
  });
  if (!methodAbi) {
    throw new Error("method not found: " + methodName);
  }
  const block = accountBlock.createAccountBlock("callContract", {
    address: from,
    abi: methodAbi,
    toAddress: to,
    params: params,
    tokenId: tokenId,
    amount: amount,
  });
  block.setProvider(provider).setPrivateKey(signerKey);

  await block.autoSetPreviousAccountBlock();
  const result = await block.sign().send();
  console.log("send block success", result);
  return result;
}

async function readContract(
  provider: any,
  to: string,
  abi: Array<{
    name: string;
    type: string;
    stateMutability: string;
    outputs: Array<{ type: string }>;
  }>,
  code: any,
  methodName: string,
  params: any[]
) {
  const methodAbi = abi.find((x) => {
    return (
      x.type === "function" &&
      x.stateMutability === "view" &&
      x.name === methodName
    );
  });
  if (!methodAbi) {
    throw new Error("method not found:" + methodName);
  }

  let data = abiUtils.encodeFunctionCall(methodAbi, params);
  let dataBase64 = Buffer.from(data, "hex").toString("base64");

  const result = await provider.request("contract_query", {
    address: to,
    data: dataBase64,
  });
  if (result) {
    let resultBytes = Buffer.from(result, "base64").toString("hex");
    let outputs = [];
    for (let i = 0; i < methodAbi.outputs.length; i++) {
      outputs.push(methodAbi.outputs[i].type);
    }
    return abiUtils.decodeParameters(outputs, resultBytes);
  }
  return undefined;
}

export async function confirmed(
  provider: any,
  hash: string,
  confirmedThreshold: number
) {
  return provider
    .request("ledger_getAccountBlockByHash", hash)
    .then((block: any) => {
      if (!block) {
        return false;
      } else {
        if (!block.confirmedHash) {
          return false;
        }
        if (block.confirmedTimes < confirmedThreshold) {
          return false;
        }
        return true;
      }
    });
}
