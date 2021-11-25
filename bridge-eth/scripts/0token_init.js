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
  const erc20 = await deployContract("ERC20Token", ['VITE', 'VITE']);
  console.log("erc20 address", erc20.address);

  const [account1] = await ethers.getSigners();

  erc20.connect(account1);
 
  await erc20.mint(account1.address, ethers.utils.parseEther("1000000.0"));
  console.log("erc20 address", erc20.address);
}

async function main() {
  await init();
}

main().then(() => {
  console.log("init done");
});
// usdt 0x0d090D438bA8F9e2380b0eFe687634361caD402F
// vite 0x84AEEa373eF0aCd04f94B15Aa36F4475A0ac6457