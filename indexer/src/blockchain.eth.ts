import { Provider } from "@ethersproject/abstract-provider";
import { ethers } from "ethers";
import { Event } from "./blockchain";

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
    // console.log(typeof this.filter);
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
      for (const event of events) {
        if (await this.storage.exist(event, this.key)) {
          continue;
        }
        const block = await this.provider.getBlock(event.blockHash);
        const result = mapEthEvent(
          this.network,
          this.networkType,
          event,
          block
        );
        this.storage.put(result, this.key);
        // console.log("++++++++++", JSON.stringify(event));
        // console.log(event);
        // console.log(typeof event.args);
      }
    }
    console.log(
      `[${this.network}] pull ${this.address} ${this.eventName}, ${from}->${to}, total:${events.length}`
    );
  }

  async subscribe() {
    this.contract.on(this.filter(), async (...args: any[]) => {
      const event = args[args.length - 1];
      const block = await this.provider.getBlock(event.blockHash);
      const result = mapEthEvent(this.network, this.networkType, event, block);
      this.storage.put(result, this.key);
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

// {
// 	"blockNumber": 14161188,
// 	"blockHash": "0x68d2950077e2c7f6612783e21f27399e9a1ab91018ee1c7b2aa052ffcb74fd68",
// 	"transactionIndex": 6,
// 	"removed": false,
// 	"address": "0x2FE56DB3F21815Ab26828debC175aB08D91CF81D",
// 	"data": "0x0000000000000000000000000000000000000000000000000000000000000003550b670c397b8b5bfb35ad7b6f6d5e3beecc6d6157efe51c806d3524590d336b00000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000354a6ba7a1800000000000000000000000000000000000000000000000000000000000000000015cecce91eb5ed40879105e1c780c572d087bb6ec9000000000000000000000000",
// 	"topics": ["0xdf9c1bddd95b435230ebc5dbae80cf520beed8c5ae2118b70a9be6b61fd56631"],
// 	"transactionHash": "0x82f71fa824e2ed0a5c7f2c3a9a18ec638317fb484a5fd1e2451b8958bb51ff00",
// 	"logIndex": 16,
// 	"event": "Input",
// 	"eventSignature": "Input(uint256,bytes32,bytes,uint256)",
// 	"args": [{
// 		"type": "BigNumber",
// 		"hex": "0x03"
// 	}, "0x550b670c397b8b5bfb35ad7b6f6d5e3beecc6d6157efe51c806d3524590d336b", "0xcecce91eb5ed40879105e1c780c572d087bb6ec900", {
// 		"type": "BigNumber",
// 		"hex": "0x0354a6ba7a180000"
// 	}]
// }

function mapEthEvent(
  network: string,
  networkType: string,
  event: any,
  block: any
) {
  let result: Event = {
    network: network,
    networkType: networkType,
    args: mapEthArgs(event.args),
    blockNumber: event.blockNumber,
    blockHash: event.blockHash,
    transactionIndex: event.transactionIndex,
    transactionHash: event.transactionHash,
    logIndex: event.logIndex,
    event: event.event,
    address: event.address,
    time: block.timestamp,
  };
  return result;
}

function mapEthArgs(args: any) {
  let results: { [k: string]: string } = {};
  for (const key of Object.keys(args)) {
    if (!isNaN(Number(key))) {
      continue;
    }
    results[key] = args[key as keyof typeof args].toString();
  }
  return results;
}
