import { expect } from "chai";
const vuilder = require("@vite/vuilder");
import config from "./deploy.config.json";
import channelCfg from "./channel.config.json"

const tokenId = "tti_5649544520544f4b454e6e40";
const addressArr = [
  "vite_cecce91eb5ed40879105e1c780c572d087bb6ec91db043f422",
  "vite_0afd645ca4b97441cae39c51e0b29355cbccbf43440457be7b",
  "vite_10930bed5611218376df608b976743fa3127b5f008e8f27f83",
];
const threshold = "3";


async function initRelayAccounts(provider: any, deployer: any){
	const keepers: any[] = [];
	keepers.push(vuilder.newAccount(config.mnemonic, 0, provider));
	keepers.push(vuilder.newAccount(config.mnemonic, 1, provider));
	keepers.push(vuilder.newAccount(config.mnemonic, 2, provider));
  
	for (let i = 0; i < addressArr.length; i++) {
	  await deployer.send({ toAddress: addressArr[i] }).autoSend();
	}
	await Promise.all([
	  keepers[0].receiveAll(),
	  keepers[1].receiveAll(),
	  keepers[2].receiveAll(),
	]);

	return keepers;
}

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

  const keepers = await initRelayAccounts(provider, deployer);

  const keeperId = "0";

  await vault.call("newKeepers", [addressArr, threshold], {
	amount: "0",
  });

  const block = await vault.call(
	"newChannelWithHash",
	[tokenId, channelCfg.inputHash, channelCfg.outputHash, keeperId],
	{ amount: "0" }
  );
  {
	// expect LogChannelsAddition event
	const events = await vault.getPastEvents("LogChannelsAddition", {
	  fromHeight: block.height,
	  toHeight: block.height,
	});
	expect(events.map((event: any) => event.returnValues)).to.be.deep.equal([
	  {
		"0": "0",
		"1": tokenId,
		id: "0",
		token: tokenId,
	  },
	]);
  }
  {
	// 2.4 * 10**17
	await deployer.sendToken(vault.address, "2400000000000000000", tokenId);
  }

  const result = {
	  vault: vault.address,
	  channelId: 0
  }

  console.log("result: ", JSON.stringify(result));

  return;
}

run().then(() => {
  console.log("done");
});
