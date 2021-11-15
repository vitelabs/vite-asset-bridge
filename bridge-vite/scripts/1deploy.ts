import {
  awaitDeploy,
  awaitReceiveAll,
  awaitSend,
  stakeQuota,
} from "../src/contract";

import cfg from "./config.json";
import initCfg from "./0init.config.json";
import contractCfg from "./1deploy.config.json";
import { newProvider } from "../src/provider";
import { accountHeight, accountQuota, accountUnReceived } from "../src/node";

async function main() {
  const provider = newProvider(cfg.url);

  const { send } = await awaitDeploy(
    provider,
    initCfg.richAddress,
    initCfg.richPrivateKey,
    contractCfg.abi,
    contractCfg.bytecode,
    {
      params: [cfg.tokenId, cfg.keepers, cfg.threshold],
    }
  );

  const contractAddress = send.toAddress;
  console.log("contract address", contractAddress);
  const quota = await accountQuota(provider, contractAddress);
  console.log("quota", quota);
  if (+quota.maxQuota === 0) {
    await stakeQuota(
      provider,
      initCfg.richAddress,
      initCfg.richPrivateKey,
      contractAddress
    );
  }
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
