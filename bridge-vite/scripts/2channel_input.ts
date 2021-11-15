import { DeployedContract } from "../src/contract";

import cfg from "./config.json";
import contractCfg from "./1deploy.config.json";
import { newProvider } from "../src/provider";

async function main() {
  const provider = newProvider(cfg.url);

  const cc = new DeployedContract(
    provider,
    cfg.channel,
    contractCfg.abi as any,
    contractCfg.offchainCode
  );

  await cc.awaitCall(cfg.from, cfg.fromKey, "input", [cfg.to, cfg.amount], {
    tokenId: cfg.tokenId,
    amount: cfg.amount,
  });
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
