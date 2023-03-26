const { use, expect, assert } = require("chai");
const cfg = require("./0contract.config.json");
const deployCfg = require("./1deploy.config.json");
const inputCfg = require("./0input_config.json");
const hre = require("hardhat");
const ethers = hre.ethers;
const vitejs = require("@vite/vitejs");

async function attach(contract, address) {
  const factory = await ethers.getContractFactory(contract);
  return await factory.attach(address);
}

async function inputERC20Token() {
  const vault = await attach("Vault", cfg.vault);
  const erc20 = await attach("ERC20Token", deployCfg.erc20);

  const [account1] = await ethers.getSigners();
  console.log(account1.address);
  vault.connect(account1);
  erc20.connect(account1);

  const channelId = cfg.channelId;
  console.log("channelId", channelId);
  
  const dest = "0x" + vitejs.wallet.getOriginalAddressFromAddress(inputCfg.to);
  const value = inputCfg.amount;
 
  await erc20.approve(vault.address, value);
  await vault.input(channelId, dest, value);

  console.log("result: ", JSON.stringify({success: true}))
}

async function inputETH() {
  const vault = await attach("Vault", cfg.vault);

  const [account1] = await ethers.getSigners();
  console.log("address:", account1)
  vault.connect(account1);

  const channelId = cfg.channelId;
  console.log("channelId", channelId);
  
  const dest = "0x" + vitejs.wallet.getOriginalAddressFromAddress(inputCfg.to);
  const value = inputCfg.amount;
 
  const options = {value: ethers.utils.parseEther("0.01")}
  await vault.input(channelId, dest, value, options);

  console.log("result: ", JSON.stringify({success: true}))
}

async function main() {
  await hre.run("compile");
  await inputERC20Token();
  // await inputETH();
}

main().then(() => {
  console.log("input done");
});
