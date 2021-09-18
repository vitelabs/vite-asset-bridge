// import cfg from "./config";

// import {
//   ViteAPI,
//   wallet,
//   utils,
//   abi,
//   accountBlock,
//   keystore,
// } from "@vite/vitejs";

// const mnemonic = cfg.networks.local.mnemonic;

// // test accounts
// const viteWallet = wallet.getWallet(mnemonic);

// const _accounts = viteWallet.deriveAddressList(0, 10);

// // console.log("Default Accounts:");

// _accounts.forEach((account, index) => {
//   console.log(index, account.address, account.privateKey);
// });

// export const accounts = _accounts;

// export const defaultWallet = viteWallet;

import { accountBlock } from "@vite/vitejs";
import { provider } from "./provider";
import { selectAccount } from "./accounts";

async function signAndSendAccountBlock(block: any, privateKey: string) {
  block.setProvider(provider).setPrivateKey(privateKey);
  await block.autoSetPreviousAccountBlock();
  const result = await block.sign().send();
  console.log("send success", result);
  return result;
}

async function _deployContract(
  address: string,
  abi: Object | Array<Object>,
  code: string,
  {
    responseLatency = 0,
    quotaMultiplier = 10,
    randomDegree = 0,
    params,
  }: {
    responseLatency?: Number;
    quotaMultiplier?: Number;
    randomDegree?: Number;
    params?: string | Array<string | boolean>;
  }
) {
  const account = selectAccount(address);
  const block = accountBlock.createAccountBlock("createContract", {
    abi: abi,
    code: code,
    quotaMultiplier: quotaMultiplier,
    randomDegree: randomDegree,
    responseLatency: responseLatency,
    params: params,
  });

  await signAndSendAccountBlock(block, account.privateKey);
}

export const deployContract = _deployContract;
