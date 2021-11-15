const cfg = require("/vitejs.config");

const {
  ViteAPI,
  wallet,
  utils,
  abi,
  accountBlock,
  keystore,
} = require("@vite/vitejs");

// test accounts
const mnemonic = cfg.mnemonic;
const viteWallet = wallet.getWallet(mnemonic);

const accounts = viteWallet.deriveAddressList(0, 10);

console.log("Default Accounts:");

accounts.forEach((account, index) => {
  console.log(index, account.address, account.path);
});
