const cfg = require("./1deploy.config.json");
const vaultCfg = require("./0contract.config.json");
const hre = require("hardhat");
const ethers = hre.ethers;

async function deployContract(name, args) {
  let contractMode = await ethers.getContractFactory(name);
  let contractIns = await contractMode.deploy(...args);
  await contractIns.deployed();
  return contractIns;
}

async function attach(contract, address) {
  console.log("attach contract", contract, address);
  const factory = await ethers.getContractFactory(contract);
  return await factory.attach(address);
}

async function printChannels() {
  const vault = await attach("Vault", vaultCfg.vault);

  const [owner] = await ethers.getSigners();
  vault.connect(owner);
  const channelsLength = await vault.channelsLength();
  console.log("channelsLength", channelsLength.toString());

  for (let i = 0; i < channelsLength; i++) {
    const channel = await vault.channels(i);

	const result = {
		channelId: i,
		inputId:channel.inputId.toString(),
		inputHash: channel.inputHash,
		outputId: channel.outputId.toString(),
		outputHash: channel.outputHash,
		erc20: channel.erc20, 
		keeper: channel.keeper
	  };
	  console.log("result: ", result);
  }
}

async function main() {
  await hre.run("compile");
  await printChannels();
}

main().then(() => {
  console.log("print channels done");
});
