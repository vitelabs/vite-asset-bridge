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

async function output() {
  const vault = await attach("Vault", cfg.vault);
  const channel = await vault.channels(cfg.channelId);

  console.log("result: ", JSON.stringify({outputId: channel[2].toString()}));
}

async function main() {
  await hre.run("compile");
  await output();
}

main().then(() => {
  console.log("done");
});
