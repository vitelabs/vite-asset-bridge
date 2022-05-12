const cfg = require("./1deploy.config.json");
const hre = require("hardhat");
const ethers = hre.ethers;

async function deployContract(name, args) {
  let contractMode = await ethers.getContractFactory(name);
  let contractIns = await contractMode.deploy(...args);
  await contractIns.deployed();
  return contractIns;
}


async function attach(contract, address) {
  const factory = await ethers.getContractFactory(contract);
  return await factory.attach(address);
}

async function deploy() {
  const keeper = await deployContract("KeeperMultiSig", [
    cfg.keepers,
    cfg.threshold,
  ]);
  console.log("keeper deployed", keeper.address);
  const vault = await deployContract("Vault", [keeper.address]);

  console.log("vault deployed", vault.address);
}

async function main() {
  await hre.run("compile");
  await deploy();
}

main().then(() => {
  console.log("deploy done");
});
