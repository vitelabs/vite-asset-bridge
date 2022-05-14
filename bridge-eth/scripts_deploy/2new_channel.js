const cfg = require("./1deploy.config.json");
const vaultCfg = require("./0contract.config.json");
const hre = require("hardhat");
const ethers = hre.ethers;


async function attach(contract, address) {
  const factory = await ethers.getContractFactory(contract);
  return await factory.attach(address);
}

async function newChannel() {
  const vault = await attach("Vault", vaultCfg.vault);

  const [owner] = await ethers.getSigners();
  await vault.connect(owner);

  await vault.newChannel(cfg.erc20, vaultCfg.keeper, {});

  console.log("new channel success");
}

async function main() {
  await hre.run("compile");
  await newChannel();
}

main().then(() => {
  console.log("new channel done");
});
