const cfg = require("./1deploy.config.json");
const contractCfg = require("./0contract.config.json");
const hre = require("hardhat");
const ethers = hre.ethers;

async function attach(contract, address) {
  const factory = await ethers.getContractFactory(contract);
  return await factory.attach(address);
}

async function mintToken() {
  const erc20 = await attach("ERC20Token", cfg.erc20);

  const [owner] = await ethers.getSigners();
  erc20.connect(owner);

  await erc20.mint(contractCfg.vault, ethers.utils.parseEther("10000"));

}

async function main() {
  await mintToken();
}

main().then(() => {
  console.log("mintToken done");
});
