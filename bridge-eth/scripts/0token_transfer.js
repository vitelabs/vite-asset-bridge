const cfg = require("./config.json");
const hre = require("hardhat");
const ethers = hre.ethers;

async function attach(contract, address) {
  const factory = await ethers.getContractFactory(contract);
  return await factory.attach(address);
}


async function init() {
  const erc20 = await attach("ERC20Token", "0xDC0B2bd7cA7deFfbf1a713F87059C9a139c5bB1D");
  console.log("erc20 address", erc20.address);

  const [account1] = await ethers.getSigners();
  erc20.connect(account1);

  await erc20.mint("0x848aB97D30fC2E3f4cc9d8F37Aff68A5A716a352", ethers.utils.parseEther("10000000.0"));
  // await erc20.transfer("0xEa52147b9b1d2bf069Da858eFE78bB2aC3dc2EA0", ethers.utils.parseEther("1000000.0"));
  console.log("erc20 address", erc20.address);
}

async function main() {
  await init();
}

main().then(() => {
  console.log("transfer done");
});
// usdt 0x1fF7EFed79585D43FB1c637064480E10c21dB709
// vite 0xEa52147b9b1d2bf069Da858eFE78bB2aC3dc2EA0