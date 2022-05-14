import { expect } from "chai";
const vuilder = require("@vite/vuilder");
import config from "./deploy.config.json";
import channelCfg from "./channel.config.json"
import contractCfg from "./contract.config.json"
import { ethers } from "ethers";

async function run(): Promise<void> {
  
  const provider = vuilder.newProvider(config.http);
  const deployer = vuilder.newAccount(config.deployer, 0, provider);

  // fix: stakeForQuota not work right now 
  const block = deployer.stakeForQuota({ beneficiaryAddress: contractCfg.vault, amount: ethers.utils.parseEther("5000")});
  await block.autoSend();

  console.log("stake quota success.")
  return;
}

run().then(() => {
  console.log("done");
});
