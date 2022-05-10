import { expect } from "chai";
const vuilder = require("@vite/vuilder");
import config from "./deploy.config.json";
import inputCfg from "./input.config.json";
import vaultCfg from "./contract.config.json";

async function run(): Promise<void> {
  const provider = vuilder.newProvider(config.http);
  const deployer = vuilder.newAccount(config.deployer, 0, provider);

  const compiledContracts = await vuilder.compile("Vault.solpp");
  expect(compiledContracts).to.have.property("Vault");

  // deploy
  const vault = compiledContracts.Vault;
  vault.setDeployer(deployer).setProvider(provider);
  await vault.attach(vaultCfg.vault);
  expect(vault.address).to.be.a("string");

  const channel = await vault.query("channels", [vaultCfg.channelId])

  console.log("result: ", JSON.stringify({ outputId: channel[2]}));
  return;
}

run().then(() => {
  console.log("done");
});
