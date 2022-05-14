import { expect } from "chai";
const vuilder = require("@vite/vuilder");
import config from "./deploy.config.json";

async function run(): Promise<void> {
  const provider = vuilder.newProvider(config.http);
  const deployer = vuilder.newAccount(config.deployer, 0, provider);

  const compiledContracts = await vuilder.compile("Vault.solpp");
  expect(compiledContracts).to.have.property("Vault");

  // deploy
  const vault = compiledContracts.Vault;
  vault.setDeployer(deployer).setProvider(provider);
  await vault.deploy({});
  expect(vault.address).to.be.a("string");

  console.log("vault deployed", vault.address);
  return;
}

run().then(() => {
  console.log("done");
});
