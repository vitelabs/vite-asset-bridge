import { expect } from "chai";
const vuilder = require("@vite/vuilder");
import config from "./deploy.config.json";
import channelCfg from "./channel.config.json"
import contractCfg from "./contract.config.json"

async function run(): Promise<void> {
  const provider = vuilder.newProvider(config.http);
  const deployer = vuilder.newAccount(config.deployer, 0, provider);

  const compiledContracts = await vuilder.compile("Vault.solpp");
  expect(compiledContracts).to.have.property("Vault");

  // deploy
  const vault = compiledContracts.Vault;
  vault.setDeployer(deployer).setProvider(provider);
  await vault.attach(contractCfg.vault);
  expect(vault.address).to.be.a("string");

  const block1 = await vault.call(
	"newChannelWithHash",
	[channelCfg.tokenId, channelCfg.inputHash, channelCfg.outputHash, channelCfg.keeperId],
	{ amount: "0" }
  );

  console.log("new channel success.")
  return;
}

run().then(() => {
  console.log("done");
});
