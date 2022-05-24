import * as vuilder from "@vite/vuilder";
import { expect } from "chai";
import config from "./deploy.config.json";
import contractCfg from "./contract.config.json";

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

  const txHash =
    "222f301a96e0e9248ab14f9877736d7c1c3b4a5a9e3ac1bb219c05c419bf85aa";
  const block = await provider.request("ledger_getAccountBlockByHash", txHash);
  
  if(block.receiveBlockHash){

    const receivedBlock = await provider.request("ledger_getAccountBlockByHash", block.receiveBlockHash);
    const events = await vault.getPastEvents("Input", {
      fromHeight: receivedBlock.height.toString(),
      toHeight: "0",
    });

    if(events && events.length > 0){
      console.log("channelId:", events[0].returnValues.channelId);
      console.log("inputId:", events[0].returnValues.index);
      console.log("inputHash:", events[0].returnValues.inputHash);
    }
    
    console.log("confirmations:", receivedBlock.confirmations);
  }
  
  


  return;
}

run().then(() => {
  console.log("done");
});


