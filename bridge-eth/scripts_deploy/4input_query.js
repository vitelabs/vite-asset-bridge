const cfg = require("./1deploy.config.json");
const vaultCfg = require("./0contract.config.json");
const hre = require("hardhat");
const ethers = hre.ethers;

async function attach(contract, address) {
  const factory = await ethers.getContractFactory(contract);
  return await factory.attach(address);
}

async function query() {
  const vault = await attach("Vault", vaultCfg.vault);

  const txHash =
    "0xefa21ca3c9c37399b1c2981eab1512cb1186249f4cc4b67223345b8bbfb41c1b";

  const tx = await ethers.provider.getTransaction(txHash);

  if (tx) {
    const currentNumber = await ethers.provider.getBlockNumber();
    console.log("confirmed number:", currentNumber - tx.blockNumber);

    const events = await vault.queryFilter(
      vault.filters.Input,
      tx.blockNumber,
      tx.blockNumber
    );
    if (events && events.length > 0) {
      // console.log(events);
      console.log(`channelId:${events[0].args.channelId.toString()}, inputHash:${events[0].args.inputHash}, inputId:${events[0].args.index.toString()}`);
    }
  }
  console.log(tx);
}

async function main() {
  await hre.run("compile");
  await query();
}

main().then(() => {
  console.log("query channel input");
});
