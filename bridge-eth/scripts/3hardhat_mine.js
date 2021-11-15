const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  await ethers.provider.send("evm_mine");
}

main().then(() => {
  console.log("inc done");
});
