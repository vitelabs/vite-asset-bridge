const { use, expect, assert } = require("chai");
const cfg = require("./0contract_config.json");
const inputCfg = require("./0input_config.json");
const hre = require("hardhat");
const ethers = hre.ethers;
const vitejs = require("@vite/vitejs");

async function attach(contract, address) {
  const factory = await ethers.getContractFactory(contract);
  return await factory.attach(address);
}

async function input() {
  const vault = await attach("Vault", cfg.vault);
  const erc20 = await attach("ERC20Token", cfg.erc20);

  const [account1] = await ethers.getSigners();

  vault.connect(account1);
  erc20.connect(account1);


  const channelId = cfg.channelId;
  const dest = "0x" + vitejs.wallet.getOriginalAddressFromAddress(inputCfg.to);
  const value = inputCfg.amount;
 
  await erc20.approve(vault.address, value);
  await vault.input(channelId, dest, value);

  console.log("result: ", JSON.stringify({success: true}))
}

async function main() {
  await hre.run("compile");
  await input();
}

main().then(() => {
  console.log("input done");
});
