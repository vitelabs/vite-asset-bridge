import { expect } from "chai";
import { ViteAPI, abi as abiUtils } from "@vite/vitejs";
import * as vuilder from "@vite/vuilder";
import config from "./deploy.config.json";
import channelCfg from "./channel.config.json";
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

  const block = await provider.request(
    "ledger_getLatestAccountBlock",
    contractCfg.vault
  );

  const output = {
    channelId: 0,
    outputHash:
      "0x9df3caa84eee27c5785fc2a9b5cc5295154231968f683a32c99a13ff73fa49f6",
    outputId: 1,
  };

  const channel = await vault.query("channels", [output.channelId]);

  if (+channel[2].toString() >= output.outputId) {
    const event = await scanOutputBlock(
      vault,
      +block.height - 10 < 0 ? 1 : +block.height - 10,
      output.outputHash.replace("0x", "")
    );
    if (event) {
      const block = await provider.request(
        "ledger_getAccountBlockByHash",
        event.accountBlockHash
      );
      console.log("confirmations:", block.confirmations);
    }
  }
  return;
}

run().then(() => {
  console.log("done");
});

async function scanOutputBlock(vault: any, height: number, outputHash: string) {
  const events = await vault.getPastEvents("Output", {
    fromHeight: height.toString(),
    toHeight: "0",
  });

  //   console.log("events", events);
  for (let i = 0; i < events.length; i++) {
    if (events[i].returnValues["outputHash"] === outputHash) {
      return events[i];
    }
  }
  return undefined;
}
