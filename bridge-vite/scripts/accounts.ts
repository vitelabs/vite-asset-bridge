import * as cfg from "./accounts.json";
import { wallet } from "@vite/vitejs";

// test accounts
const viteWallet = wallet.getWallet(cfg.mnemonic);

const _accounts = viteWallet.deriveAddressList(0, 10);

_accounts.forEach((x) => {
  console.log(x.address, x.privateKey);
});
console.log("done");
