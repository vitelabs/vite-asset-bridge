const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const [account1, account2, account3] = await ethers.getSigners();

  console.log(
    `"${account1.address}","${account2.address}","${account3.address}"`
  );
  console.log(account1.address);
  console.log(account2.address);
  console.log(account3.address);
}

main().then(() => {
  console.log("done");
});
