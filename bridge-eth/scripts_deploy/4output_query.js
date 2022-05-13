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

  const output = {
    ethChannelId: 1,
    outputHash:
      "0x" + "ea509329d12c46c102b782735d10edc490a4e148576fe1c3a5c3a0bee0344648",
    outputId: 1,
  };

  const currentNumber = await ethers.provider.getBlockNumber();
  // console.log("confirmed number:", currentNumber - tx.blockNumber);

  const events = await vault.queryFilter(
    vault.filters.Output(null, null, null, null, null),
    currentNumber - 1000,
    currentNumber
  );
  if (events && events.length > 0) {
    const target = events.filter((x) => {
      console.log(x.args.outputHash === output.outputHash);
    return x.args.outputHash === output.outputHash;
    });
    console.log("confirmations:", currentNumber - target[0].blockNumber);
    // console.log("confirmed number:", currentNumber - tx.blockNumber);
  }
  // console.log(tx);
}

async function main() {
  await hre.run("compile");
  await query();
}

main().then(() => {
  console.log("query channel input");
});
