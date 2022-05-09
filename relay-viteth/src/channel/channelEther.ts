// ---------
// ---------
import * as utils from "../utils/utils";
import { ethers } from "ethers";
import { newEtherProvider, privateKey } from "./common";
import _channelAbi from "./channel.ether.abi.json";
import _keeperAbi from "./keeper.ether.abi.json";

export interface LogEvent {
  height: number;
  txIndex: number;
  logIndex: number;
}
export interface InputEvent extends LogEvent {
  channelId: string;
  index: number;
  inputHash: string;
  dest: string;
  value: string;
}

export interface StoredLogIndex extends LogEvent {
  inputsIndex: { [k: string]: number };
}

function compareTo(x: LogEvent, y: LogEvent): number {
  if (x.height < y.height) {
    return -1;
  } else if (x.height > y.height) {
    return 1;
  }

  if (x.txIndex < y.txIndex) {
    return -1;
  } else if (x.txIndex > y.txIndex) {
    return 1;
  }

  if (x.logIndex < y.logIndex) {
    return -1;
  } else if (x.logIndex > y.logIndex) {
    return 1;
  }
  return 0;
}

interface Input {
  id: string;
  index: string;

  height: number;
  txIndex: number;
  logIndex: number;
}

const ETH_INFO_PATH_PREFIX = ".channel_ether/info";

export class ChannelEther {
  infoPath: string;

  etherChannelAddress: string;
  etherChannelAbi: any[];
  etherProvider: any;
  etherChannelContract: ethers.Contract;

  etherKeeperContract: ethers.Contract;
  etherKeeperAddress: string;
  etherKeeperAbi: any[];
  etherKeeperThreshold: number;

  signerKey: string;
  signer: ethers.Wallet;

  fromBlockHeight: string;

  confirmedThreshold: number;
  constructor(cfg: any, dataDir: string) {
    this.etherChannelAbi = _channelAbi;
    this.etherKeeperAbi = _keeperAbi;
    if (dataDir) {
      this.infoPath = dataDir + "/" + ETH_INFO_PATH_PREFIX;
    } else {
      this.infoPath = ETH_INFO_PATH_PREFIX;
    }
    this.fromBlockHeight = cfg.fromBlockHeight;
    this.signerKey = privateKey(cfg.account);
    this.etherChannelAddress = cfg.channelAddress;
    this.etherKeeperAddress = cfg.keeperAddress;

    this.etherProvider = newEtherProvider(cfg.endpoint);
    this.etherChannelContract = new ethers.Contract(
      this.etherChannelAddress,
      this.etherChannelAbi,
      this.etherProvider
    );

    this.etherKeeperContract = new ethers.Contract(
      this.etherKeeperAddress,
      this.etherKeeperAbi,
      this.etherProvider
    );
    this.etherKeeperThreshold = 100000;
    this.signer = new ethers.Wallet(this.signerKey, this.etherProvider);
    this.confirmedThreshold = cfg.confirmedThreshold;
  }

  async init() {
    this.etherKeeperThreshold = await this.etherKeeperContract.threshold();
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

  filterAndSortInput(info: LogEvent, inputs: InputEvent[]): InputEvent[] {
    const filteredInputs = inputs.filter((x: any) => {
      return compareTo(x, info) > 0;
    });

    return filteredInputs.sort(compareTo);
  }

  checkInputIndex(input: InputEvent, storedInputs: StoredLogIndex): boolean {
    const storedIndex = storedInputs.inputsIndex[input.channelId];
    if (!storedIndex && input.index === 1) {
      return true;
    }
    if (storedIndex && input.index === storedIndex + 1) {
      return true;
    }
    return false;
  }

  async scanConfirmedInputs(
    fromHeight: number
  ): Promise<{ toHeight: number; events: InputEvent[] }> {
    if (fromHeight === 0) {
      fromHeight = +this.fromBlockHeight;
    }
    const current = await this.etherProvider.getBlockNumber();

    let toHeight = BigInt(current) - BigInt(this.confirmedThreshold);
    if (BigInt(toHeight) > BigInt(fromHeight) + 5000n) {
      toHeight = BigInt(fromHeight) + 5000n;
    }

    // if (toHeight <= BigInt(fromHeight)) {
    //   return [fromHeight, null];
    // }

    const filterInput = this.etherChannelContract.filters.Input(
      null,
      null,
      null,
      null
    );

    const inputs = await this.etherChannelContract.queryFilter(
      filterInput,
      fromHeight,
      +toHeight.toString()
    );

    if (!inputs || inputs.length === 0) {
      return { toHeight: +toHeight.toString(), events: [] };
    }
    return {
      toHeight: +toHeight.toString(),
      events: inputs.map((input: any) => {
        return {
          height: +input.blockNumber,
          txIndex: input.transactionIndex,
          logIndex: input.logIndex,
          channelId: input.args.channelId.toString(),
          index: +input.args.index.toString(),
          inputHash: input.args.inputHash,
          dest: input.args.dest,
          value: input.args.value.toString(),
        };
      }),
    };
  }

  async isKeeper(msg: string, r: string, s: string, v: number) {
    const expandedSig = {
      r: r,
      s: s,
      v: v,
    };
    const signature = ethers.utils.joinSignature(expandedSig);
    const recoveredAddress = ethers.utils.recoverAddress(msg, signature);
    // console.log("keeper", recoveredAddress);
    return this.etherKeeperContract.keepers(recoveredAddress);
  }

  async approveId(msg: string, events: any[]) {
    let sigs: any[] = [];
    events.forEach((sig) => {
      const address = ethers.utils.recoverAddress(msg, sig);
      sigs.push(Object.assign(sig, { address: address }));
    });

    sigs.sort(function (a, b) {
      if (a.address < b.address) return -1;
      if (a.address > b.address) return 1;
      return 0;
    });

    const rArr = sigs.map((s) => s.r);
    const vArr = sigs.map((s) => s.v);
    const sArr = sigs.map((s) => s.s);

    await this.etherKeeperContract
      .connect(this.signer)
      .approveId(vArr, rArr, sArr, msg);
  }

  async approveAndExecOutput(
    msg: string,
    events: any[],
    dest: string,
    value: string
  ) {
    let sigs: any[] = [];
    events.forEach((sig) => {
      const address = ethers.utils.recoverAddress(msg, sig);
      sigs.push(Object.assign(sig, { address: address }));
    });

    sigs.sort(function (a, b) {
      if (a.address < b.address) return -1;
      if (a.address > b.address) return 1;
      return 0;
    });

    const rArr = sigs.map((s) => s.r);
    const vArr = sigs.map((s) => s.v);
    const sArr = sigs.map((s) => s.s);

    await this.etherKeeperContract
      .connect(this.signer)
      .approveAndExecOutput(
        vArr,
        rArr,
        sArr,
        msg,
        dest,
        value,
        this.etherChannelAddress
      );
  }

  async signId(id: string) {
    const signingKey = new ethers.utils.SigningKey(this.signerKey);
    return signingKey.signDigest(id);
  }

  async inputIndex() {
    return this.etherChannelContract.inputIndex();
  }

  async prevInputId() {
    return this.etherChannelContract.prevInputId();
  }

  async outputIndex() {
    return this.etherChannelContract.outputIndex();
  }

  async prevOutputId() {
    return this.etherChannelContract.prevOutputId();
  }

  async token() {
    return this.etherChannelContract.token();
  }
}
