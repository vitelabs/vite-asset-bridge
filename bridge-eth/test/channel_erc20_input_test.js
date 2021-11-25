// test/vault_test.js
// Load dependencies
const { use, expect, assert } = require("chai");
const { solidity } = require("ethereum-waffle");
const { ethers } = require("hardhat");
const keccak256 = require("keccak256");

use(solidity);

let channel;
let erc20;
let keeper;

async function deployContract(name, args) {
  let contractMode = await ethers.getContractFactory(name);
  let contractIns = await contractMode.deploy(...args);
  await contractIns.deployed();
  return contractIns;
}

// Start test block
describe("Channel Inputs Outputs", function () {
  beforeEach(async function () {
    erc20 = await deployContract("ERC20Token", ["TTT","TTTT"]);
    keeper = await deployContract("KeeperNone", []);
    channel = await deployContract("ChannelERC20", [
      erc20.address,
      keeper.address,
    ]);
  });

  it("Should input", async function () {
    const [account1] = await ethers.getSigners();

    channel.connect(account1);
    erc20.connect(account1);

    const dest = "0x40996a2ba285ad38930e09a43ee1bd0d84f756f600";
    const value = ethers.utils.parseEther("1.0");
    const prevHash = await channel.prevInputId();

    const id = ethers.utils.solidityKeccak256(
      ["uint256", "bytes", "uint256", "bytes32"],
      [0, dest, value, prevHash]
    );

    console.log("id:", id);
    console.log("value:", ethers.utils.parseEther("1.0").toString());

    await erc20.approve(channel.address, value);
    await expect(channel.input(dest, value))
      .to.emit(channel, "Input")
      .withArgs(1, id, ethers.utils.hexlify(dest), value);

    const balance = await erc20.balanceOf(channel.address);

    assert.equal(balance.toString(), ethers.utils.parseEther("1.0").toString());
  });
});
