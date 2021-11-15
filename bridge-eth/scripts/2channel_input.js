const { use, expect, assert } = require("chai");
const cfg = require("./config.json");
const hre = require("hardhat");
const ethers = hre.ethers;
const vitejs = require("@vite/vitejs");

async function attach(contract, address) {
  const factory = await ethers.getContractFactory(contract);
  return await factory.attach(address);
}

async function input() {
  const keeper = await attach("KeeperMultiSig", cfg.keeper);
  const channel = await attach("ChannelERC20", cfg.channel);
  const erc20 = await attach("ERC20Token", cfg.erc20);

  const [account1] = await ethers.getSigners();

  channel.connect(account1);
  erc20.connect(account1);

  const dest = "0x" + vitejs.wallet.getOriginalAddressFromAddress(cfg.to);
  const value = ethers.utils.parseEther("0.023");
  const prevHash = await channel.prevInputId();

  const id = ethers.utils.solidityKeccak256(
    ["uint256", "bytes", "uint256", "bytes32"],
    [0, dest, value, prevHash]
  );

  console.log("id:", id);
  console.log("dest:", dest);
  console.log("value:", value.toString());

  console.log(
    "balance before",
    (await erc20.balanceOf(channel.address)).toString()
  );

  await erc20.approve(channel.address, value);
  await channel.input(dest, value);

  console.log(
    "balance after",
    (await erc20.balanceOf(channel.address)).toString()
  );
}

async function main() {
  await hre.run("compile");
  await input();
}

main().then(() => {
  console.log("input done");
});
