const vuilder = require("@vite/vuilder");
import config from "./deploy.config.json";
import vaultCfg from "./contract.config.json";

async function run(): Promise<void> {
  
  const provider = vuilder.newProvider(config.http);
  const tokenId = "tti_5649544520544f4b454e6e40";
  const vaultV = BigInt((await provider.getBalanceInfo(vaultCfg.vault)).balance.balanceInfoMap[tokenId].balance);
  console.log("the vault value is:", vaultV.toString());
  return;
}

run().then(() => {
  console.log("done");
});
