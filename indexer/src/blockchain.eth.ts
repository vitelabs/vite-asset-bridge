import { Provider } from "@ethersproject/abstract-provider";
import { ethers } from "ethers";

export class ScannerEth {
  networkType: string;
  network: string;
  provider: Provider;
  address: string;
  abi: any[];
  eventName: string;
  contract: ethers.Contract;

  filter: any;
  storage: any;

  constructor(storage: any, cfg: any) {
    this.storage = storage;
    this.networkType = "eth";
    this.network = cfg.network;
    this.provider = newEtherProvider(cfg.endpoint);
    this.address = cfg.address;
    this.abi = cfg.abi;
    this.lastHeight = +cfg.fromBlockHeight;
    this.eventName = cfg.eventName;
    this.contract = new ethers.Contract(this.address, this.abi, this.provider);
    this.filter = this.contract.filters[
      this.eventName as keyof typeof this.contract.filters
    ];
    console.log(typeof this.filter);
  }

  async init() {}
  async start() {
    this.subscribe();
  }

  getStorage() {
    return this.storage;
  }

  lastHeight: number;

  async pull() {
    let from = this.lastHeight ? this.lastHeight : 0;

    const blockNumber = await this.provider.getBlockNumber();
    let to = blockNumber;

    do {
      to = blockNumber;
      if (blockNumber - from > 5000) {
        to = +from + 5000;
      }
      await this.pullFromTo(+from, +to);
      from = to;
    } while (to < blockNumber);
    this.lastHeight = blockNumber - 10;
  }

  async pullFromTo(from: number, to: number) {
    console.log(
      `[${this.network}] pull ${this.address} ${
        this.eventName
      }, ${from}->${to},${typeof from}, ${typeof to} start`
    );
    const events = await this.contract.queryFilter(this.filter(), +from, +to);
    if (events.length > 0) {
      this.storage.putAll(events, this.key);
    }
    console.log(
      `[${this.network}] pull ${this.address} ${this.eventName}, ${from}->${to}, total:${events.length}`
    );
  }

  async subscribe() {
    this.contract.on(this.filter(), (...args: any[]) => {
      const event = args[args.length - 1];
      this.storage.put(event, this.key);
      console.log(
        `[${this.network}] subscribe ${this.address} ${this.eventName}, ${event.blockNumber}, ${event.eventSignature}`
      );
    });
  }

  key = (event: any) => {
    return `${this.networkType}_${this.network}_${event.blockNumber}_${event.transactionIndex}_${event.logIndex}`;
  };
}

function newEtherProvider(cfg: any): Provider {
  if (cfg.type === "infura") {
    return new ethers.providers.InfuraProvider(cfg.network, cfg.key);
  } else if (cfg.type === "rpc") {
    return new ethers.providers.JsonRpcProvider(cfg.url);
  }
  throw new Error("error endpoint config");
}
