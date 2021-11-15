const cfg = require("./config.json");
const hre = require("hardhat");
const ethers = hre.ethers;

async function deployContract(name, args) {
  let contractMode = await ethers.getContractFactory(name);
  let contractIns = await contractMode.deploy(...args);
  await contractIns.deployed();
  return contractIns;
}

async function init() {
  const erc20 = await deployContract("ERC20Token", []);

  const [account1] = await ethers.getSigners();

  erc20.connect(account1);
  for (const k of cfg.keepers) {
    await account1.sendTransaction({
      to: k,
      value: ethers.utils.parseEther("10.0"),
    });
    await erc20.transfer(k, ethers.utils.parseEther("1.0"));
  }
  console.log("erc20 address", erc20.address);
}

async function main() {
  await init();
}

main().then(() => {
  console.log("init done");
});
