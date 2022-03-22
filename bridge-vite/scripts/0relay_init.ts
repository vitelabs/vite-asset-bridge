import { awaitReceiveAll, awaitSend, stakeQuota } from "../src/contract";

import cfg from "./0relay_init.config.json";
import { newProvider } from "../src/provider";
import {
  accountHeight,
  accountQuota,
  accountUnReceived,
  height,
} from "../src/node";
import { wallet } from "@vite/vitejs";

async function main() {
  const provider = newProvider(cfg.url);


  const viteWallet = wallet.getWallet(cfg.mnemonic);
  const addr = viteWallet.deriveAddress(cfg.index);

  console.log(addr.address);
  if(addr.address!=cfg.address) {
    throw new Error("address error")
  }
  console.log("receive token.");
  await awaitReceiveAll(provider, cfg.address, addr.privateKey);

}

// 1. stake quota for keeper
// 2. send first block to keeper
main()
  .catch((e) => {
    console.error(e);
  })
  .then(() => {
    console.log("init done");
  });
