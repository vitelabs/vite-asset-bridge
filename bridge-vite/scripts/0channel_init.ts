import { awaitReceiveAll, awaitSend, stakeQuota } from "../src/contract";

import cfg from "./config.json";
import initCfg from "./0init.config.json";
import { newProvider } from "../src/provider";
import {
  accountHeight,
  accountQuota,
  accountUnReceived,
  height,
} from "../src/node";

async function main() {
  const provider = newProvider(cfg.url);

  console.log("send token to test user.");

  await awaitSend(
    provider,
    initCfg.richAddress,
    initCfg.richPrivateKey,
    cfg.from,
    cfg.tokenId,
    (BigInt(cfg.amount) * 20n).toString()
  );

  console.log(" test user receive token.");
  await awaitReceiveAll(provider, cfg.from, cfg.fromKey);

  for (const keeper of cfg.keepers) {
    console.log("keeper", keeper);

    const quota = await accountQuota(provider, keeper);
    if (+quota.maxQuota === 0) {
      await stakeQuota(
        provider,
        initCfg.richAddress,
        initCfg.richPrivateKey,
        keeper
      );
    }

    const height = await accountHeight(provider, keeper);
    const unReceivedBlock = await accountUnReceived(provider, cfg.from);

    if (height === 0 && unReceivedBlock.length <= 0) {
      await awaitSend(
        provider,
        initCfg.richAddress,
        initCfg.richPrivateKey,
        keeper,
        cfg.tokenId,
        "0"
      );
    }
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
