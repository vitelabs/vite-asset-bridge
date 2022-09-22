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

async function inputETH() {
  const vault = await attach("Vault", cfg.vault);

  const [account1] = await ethers.getSigners();

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
  await inputETH();
}

main().then(() => {
  console.log("input done");
});
