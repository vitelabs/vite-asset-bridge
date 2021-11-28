// ---------
// ---------
import { ViteAPI, abi, constant } from "@vite/vitejs";
import { Event } from "./blockchain";
import { MemoryStorage } from "./db.event";
import { sleep } from "./utils/utils";
const { HTTP_RPC } = require("@vite/vitejs-http");
// const { WS_RPC } = require('@vite/vitejs-ws');

export class ScannerVite {
  networkType: string;
  network: string;
  provider: any;
  address: string;
  abi: any[];
  eventName: string;

  filter: any;
  argsType: any;

  storage: MemoryStorage;

  constructor(storage: any, cfg: any) {
    this.storage = storage;
    this.networkType = "vite";
    this.address = cfg.address;
    this.abi = cfg.abi;
    this.eventName = cfg.eventName;
    this.network = cfg.network;
    this.provider = new ViteAPI(new HTTP_RPC(cfg.endpoint.url), () => {
      console.log(`vite provider connected. url:${cfg.endpoint.url}`);
    });

    this.lastHeight = 0;
    this.argsType = parseType(this.eventName, this.abi);
  }

  async init() {}

  async start() {
    this.subscribe();
  }

  key = (event: any): string => {
    return `${this.networkType}_${this.network}_${event.blockNumber}_${event.transactionIndex}_${event.logIndex}`;
  };

  getStorage() {
    return this.storage;
  }

  lastHeight: number;

  async pull() {
    const from = this.lastHeight;

    const to = await accountHeight(this.provider, this.address);
    await this.pullFromTo(from, to);

    if (to >= 10) {
      this.lastHeight = to - 10;
    } else {
      this.lastHeight = 0;
    }
  }

  async pullFromTo(from: number, to: number) {
    const events = await this.scanEvents(
      String(from),
      String(to),
      this.eventName
    );
    if (events.length > 0) {
      for (const event of events) {
        if (await this.storage.exist(event, this.key)) {
          continue;
        }
        const block = await this.provider.request(
          "ledger_getAccountBlockByHash",
          event.hash
        );
        const result = mapViteEvent(
          this.network,
          this.networkType,
          event,
          block,
          this.argsType
        );
        this.storage.put(result, this.key);
      }
    }
    console.log(
      `[${this.network}] pull ${this.address} ${this.eventName}, ${from}->${to}, total:${events.length}`
    );
  }

  async scanEvents(fromHeight: string, to: string, eventName: string) {
    const address = this.address;
    let heightRange = {
      [address]: {
        fromHeight: (BigInt(fromHeight) + 1n).toString(),
        toHeight: to,
      },
    };
    // console.log(JSON.stringify(heightRange));
    const vmLogs = await this.provider.request("ledger_getVmLogsByFilter", {
      addressHeightRange: heightRange,
    });

    if (!vmLogs) {
      return [];
    }
    const eventAbi = this.abi.find(
      (item: { name: string; type: string }) =>
        item.type === "event" && item.name === eventName
    );

    const events = vmLogs.filter((x: any) => {
      return this.encodeLogId(eventAbi) === x.vmlog.topics[0];
    });

    if (!events || events.length === 0) {
      return { toHeight: fromHeight, events: [] };
    }

    // console.log(events);
    return events.map((input: any) => {
      const event: any = this.decodeEvent(input.vmlog, this.abi, eventName);
      return {
        event: event,
        height: input.accountBlockHeight,
        hash: input.accountBlockHash,
        address: input.address,
      };
    });
  }

  async subscribe() {
    let from = await accountHeight(this.provider, this.address);
    while (true) {
      let to = await accountHeight(this.provider, this.address);
      if (to <= from) {
        await sleep(1000);
        continue;
      }
      await this.pullFromTo(from, to);
      from = to;
      await sleep(1000);
    }
  }

  decodeEvent(
    log: any,
    channelAbi: Array<{ name: string; type: string }>,
    name: string
  ) {
    const result = abi.decodeLog(
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
    const result = abi.decodeLog(
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
      id = abi.encodeFunctionSignature(item);
    } else if (item.type === "event") {
      id = abi.encodeLogSignature(item);
    }
    return id;
  }
}

export function accountHeight(provider: any, addr: string) {
  return provider
    .request("ledger_getLatestAccountBlock", addr)
    .then((block: any) => {
      if (block) {
        return block.height;
      } else {
        return 0;
      }
    });
}

// {
// 	"event": {
// 		"0": "4",
// 		"1": "76741d82da9975f87db3b72d10ebdd72bd93fec05fed3026856b1c2efd98ce09",
// 		"2": "0d01fcf36b7b4f468a995b3b29cf146f5fdf2344",
// 		"3": "100000000000000000",
// 		"index": "4",
// 		"id": "76741d82da9975f87db3b72d10ebdd72bd93fec05fed3026856b1c2efd98ce09",
// 		"dest": "0d01fcf36b7b4f468a995b3b29cf146f5fdf2344",
// 		"value": "100000000000000000",
// 		"name": "Input"
// 	},
// 	"height": "23",
// 	"hash": "48dce728d7ff535fcd42e5aeb453f651008b9035e0a7cb547fc2f33e6dffff60",
// 	"address": "vite_75043ce60463a3c14b188a1505fd359acaef278c16dece5a0b"
// }

// accountAddress: "vite_0000000000000000000000000000000000000006e82b8ba657"
// address: "vite_0000000000000000000000000000000000000006e82b8ba657"
// amount: "0"
// blockType: 4
// confirmations: "930"
// confirmedHash: "0e22b96312c7dc758e7f14b3f7d5a8c169a737a8481e6e292a21b8898f984448"
// confirmedTimes: "930"
// data: "2ml7BuyVLtV6hg0xvp970s45+A89OqvX8LIVr7J6nOEA"
// difficulty: null
// fee: "0"
// firstSnapshotHash: "0e22b96312c7dc758e7f14b3f7d5a8c169a737a8481e6e292a21b8898f984448"
// firstSnapshotHeight: "77416520"
// fromAddress: "vite_b1fd7e83f1231593ebe7021685a74f8ef0e8e045ebf1adcf06"
// fromBlockHash: "11df07f452ed76a93537f5429fb331f3f35de2f3a48c492c6572087e246ccfc8"
// hash: "1c5796f140e9d15f3354c3fef1e71a234a97912a94b09182d31c527dbc717fe0"
// height: "65638707"
// logHash: null
// nonce: null
// prevHash: "6ea923b846a9035ca5bbae1a67e818e6ba16383af04035738f684459ed7020a8"
// previousHash: "6ea923b846a9035ca5bbae1a67e818e6ba16383af04035738f684459ed7020a8"
// producer: "vite_b27c59a6c829b858567a50ec1b9ead3df809f73a807db88888"
// publicKey: "VMbezHKRQzBA+7LwfBTQuDGO4ZyhSUBFxjG1pA4RXfk="
// quota: "25200"
// quotaByStake: "25200"
// quotaUsed: "25200"
// receiveBlockHash: null
// receiveBlockHeight: null
// sendBlockHash: "11df07f452ed76a93537f5429fb331f3f35de2f3a48c492c6572087e246ccfc8"
// sendBlockList: [,…]
// signature: "CRDJsfm8gITreJaLSlGvEItgqn8+zSMkaUeK8qRzL99LHeYECnSCaqXvU8ptEMr6CdTBdahSYIWdDbCwOBTQAA=="
// timestamp: 1637565122
// toAddress: "vite_0000000000000000000000000000000000000006e82b8ba657"
// tokenId: "tti_564954455820434f494e69b5"
// tokenInfo: {tokenName: "ViteX Coin", tokenSymbol: "VX", totalSupply: "29328807800509062115871669", decimals: 18,…}
// totalQuota: "25200"
// triggeredSendBlockList: [,…]
// utUsed: "1.2"
// vmLogHash: null

export function mapViteEvent(
  network: string,
  networkType: string,
  event: any,
  receiveBlock: any,
  argsType: any
) {
  const result: Event = {
    network: network,
    networkType: networkType,
    blockNumber: +receiveBlock.firstSnapshotHeight,
    blockHash: "0x"+receiveBlock.firstSnapshotHash,
    transactionIndex: event.height,
    transactionHash: "0x"+event.hash,
    logIndex: 0,
    event: event.event.name,
    address: event.address,
    args: mapViteArgs(event.event, argsType),
    time: receiveBlock.timestamp,
  };
  return result;
}

function mapViteArgs(args: any, argsType: any) {
  let results: { [k: string]: string } = {};
  for (const key of Object.keys(args)) {
    if (!isNaN(Number(key))) {
      continue;
    }
    if (argsType[key] === "bytes" || argsType[key] === "bytes32") {
      results[key] = "0x" + args[key as keyof typeof args].toString();
    } else {
      results[key] = args[key as keyof typeof args].toString();
    }
  }
  return results;
}

function parseType(eventName: string, abi: any[]) {
  const abiItem = abi.find((item) => item.name === eventName);
  let result: { [k: string]: string } = {};

  for (const item of abiItem.inputs) {
    result[item.name] = item.type;
  }
  return result;
}
