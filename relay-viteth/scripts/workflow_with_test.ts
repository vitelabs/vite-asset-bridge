import fs from "fs";
import { Workflow } from "../src/channel/index";
import relayCfg from "./sample.relay.config.json";
import channelCfg from "./channel.config.json";

const dataDir = process.env.DATA_DIR || "";
const walletIdx = process.env.WALLET_INDEX || 0;
const ethSubmit = process.env.ETH_SUBMIT || 0;

async function run() {
  console.log("wallet index", walletIdx);

  // read config file
  let cfg = relayCfg;
  cfg.vite.address = channelCfg.viteChannelAddress;
  cfg.vite.account.index = +walletIdx;
  cfg.ether.channelAddress = channelCfg.ethChannelAddress;
  cfg.ether.keeperAddress = channelCfg.ethKeeperAddress;
  cfg.ether.account.index = +walletIdx;
  cfg.ether.submitSigs = ethSubmit < 1 ? false : true;
  console.log(cfg.ether.submitSigs, ethSubmit);
  const workflow = new Workflow(cfg, dataDir);

  await workflow.init();

  while (true) {
    try {
      await workflow.work();
    } catch (err) {
      console.error(err);
    }
    await sleep(10000);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

run()
  .catch((e) => {
    console.log(e);
    console.log(typeof e);
  })
  .then(() => {
    console.log("done");
  });
