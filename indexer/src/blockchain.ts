import { ScannerEth } from "./blockchain.eth";
import { ScannerVite } from "./blockchain.vite";

export interface Scanner {
  init(): any;
  start(): any;
  pull(): any;
  height(): Promise<number>
  pullFromTo(from: number, to: number): any;
  getStorage(): any;
}

export function newScanner(storage: any, cfg: any): Scanner {
  if (cfg.networkType === "eth") {
    return new ScannerEth(storage, cfg);
  } else if (cfg.networkType === "vite") {
    return new ScannerVite(storage, cfg);
  }
  throw new Error(`error networkType: ${cfg.networkType}`);
}

export interface Event {
  network: string;
  networkType: string;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  transactionHash: string;
  logIndex: number;
  event: string;
  address: string;
  args: { [k: string]: any };
  time: number;
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
