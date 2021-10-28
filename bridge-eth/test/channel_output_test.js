// test/vault_test.js
// Load dependencies
const { use, expect, assert } = require("chai");
const { solidity } = require("ethereum-waffle");
const { ethers } = require("hardhat");
const keccak256 = require("keccak256");

use(solidity);

let channel;

async function deployContract(name, args) {
  let contractMode = await ethers.getContractFactory(name);
  let contractIns = await contractMode.deploy(...args);
  await contractIns.deployed();
  return contractIns;
}

// Start test block
describe("Channel Inputs Outputs", function () {
  beforeEach(async function () {
    channel = await deployContract("ChannelETH", []);
  });

  it("Should output", async function () {
    const [account1] = await ethers.getSigners();
    const prov = ethers.provider;

    await account1.sendTransaction({
      to: channel.address,
      value: ethers.utils.parseEther("1.0"),
    });

    const dest = "0x09FDAD54B23D937BDB6244341b24566e5F79309b";

    const balanceOfZeroBefore = await prov.getBalance(dest);

    console.log(await channel.prevOutputId());
    console.log(await channel.outputIndex());
    await expect(
      channel
        .connect(account1)
        .output(
          "0x182bfe56740a85d5ee35abc07143bf0d9f9525c43de7a988c6d03fa79ccba7e6",
          dest,
          ethers.utils.parseEther("1.0")
        )
    )
      .to.emit(channel, "Output")
      .withArgs(
        1,
        // ethers.utils.hexlify(keccak256("1")),
        "0x182bfe56740a85d5ee35abc07143bf0d9f9525c43de7a988c6d03fa79ccba7e6",
        dest,
        ethers.utils.parseEther("1.0")
      );

    console.log(await channel.prevOutputId());
    console.log(await channel.outputIndex());

    const balanceOfZero = await prov.getBalance(dest);
    assert.equal(
      (balanceOfZero - balanceOfZeroBefore).toString(),
      ethers.utils.parseEther("1.0").toString()
    );
  });
});
