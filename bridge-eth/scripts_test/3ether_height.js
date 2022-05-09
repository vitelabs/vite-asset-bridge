const hre = require("hardhat");
const ethers = hre.ethers;

async function run() {
  await ethers.provider.getBlockNumber().then((blockNumber) => {
    console.log("Current block number: " + blockNumber);
  });
  for (let i = 0; i < 15; i++) {
    await ethers.provider.send("evm_mine", []);
  }
  await ethers.provider.getBlockNumber().then((blockNumber) => {
    console.log("Current block number: " + blockNumber);
  });

  console.log("result: ", JSON.stringify({ success: true }));
}

async function main() {
  await run();
}

main().then(() => {
  console.log("input done");
});
