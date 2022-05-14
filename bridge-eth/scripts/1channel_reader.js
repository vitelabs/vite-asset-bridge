const { use, expect, assert } = require("chai");
const cfg = require("./config.json");
const hre = require("hardhat");
const ethers = hre.ethers;
const vitejs = require("@vite/vitejs");

async function attach(contract, address) {
  const factory = await ethers.getContractFactory(contract);
  return await factory.attach(address);
}

async function input() {
  const vault = await attach("Vault", cfg.channel);
  const channel = await vault.channels(0);
  console.log(channel);
}

async function main() {
  await hre.run("compile");
  await input();
}

main().then(() => {
  console.log("input done");
});
