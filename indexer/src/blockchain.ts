import { ScannerEth } from "./blockchain.eth";
import { ScannerVite } from "./blockchain.vite";

export interface Scanner {
  init(): any;
  start(): any;
  pull(): any;
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
