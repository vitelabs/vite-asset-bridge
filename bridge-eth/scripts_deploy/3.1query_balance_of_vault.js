const cfg = require("./1deploy.config.json");
const contractCfg = require("./0contract.config.json");
const hre = require("hardhat");
const ethers = hre.ethers;

async function attach(contract, address) {
  const factory = await ethers.getContractFactory(contract);
  return await factory.attach(address);
}

async function queryVaultBalanceERC20() {
  const erc20 = await attach("ERC20Token", cfg.erc20);

  const [owner] = await ethers.getSigners();
  erc20.connect(owner);

  const remainV = await erc20.balanceOf(contractCfg.vault)

  console.log("the remain value in vault:", remainV.toString());
}

async function queryVaultBalanceETH() {
  const vault = await attach("Vault", contractCfg.vault);

  const [owner] = await ethers.getSigners();
  await vault.connect(owner);

  const remainETH = await ethers.provider.getBalance(contractCfg.vault);

  console.log("the remain ETH in vault:", remainETH.toString());
}

async function main() {
  await queryVaultBalanceERC20();
  await queryVaultBalanceETH();
}

main().then(() => {
  console.log("queryVaultBalance done");
});
