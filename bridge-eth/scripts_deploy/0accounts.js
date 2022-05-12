const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const accounts = await ethers.getSigners();


  console.log(
    `"${accounts[0].address}","${accounts[1].address}","${accounts[2].address}"`
  );

  for (const index in accounts) {
    console.log(index, accounts[index].address);
    // console.log(index,account.address);
  }
}

main().then(() => {
  console.log("done");
});
