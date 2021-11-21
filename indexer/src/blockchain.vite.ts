// ---------
// ---------
import { ViteAPI, abi, constant } from "@vite/vitejs";
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

  storage: any;

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
  }

  async init() {}

  async start() {
    this.subscribe();
  }

  key = (event: any): string => {
    return `${this.networkType}_${this.network}_${this.address}_${event.height}_${event.hash}`;
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
      this.storage.putAll(events, this.key);
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

    console.log(events);
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
