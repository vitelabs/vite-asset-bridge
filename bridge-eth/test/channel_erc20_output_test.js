// test/vault_test.js
// Load dependencies
const { use, expect, assert } = require("chai");
const { solidity } = require("ethereum-waffle");
const { ethers } = require("hardhat");
const keccak256 = require("keccak256");

use(solidity);

async function deployContract(name, args) {
  let contractMode = await ethers.getContractFactory(name);
  let contractIns = await contractMode.deploy(...args);
  await contractIns.deployed();
  return contractIns;
}

let erc20;
let keeper;
let keeperMultiSig;
// Start test block
describe("Channel Inputs Outputs", function () {
  beforeEach(async function () {
    erc20 = await deployContract("ERC20Token", []);
    keeper = await deployContract("KeeperNone", []);
    const [account1, account2, account3] = await ethers.getSigners();
    keeperMultiSig = await deployContract("KeeperMultiSig", [
      [account1.address, account2.address, account3.address],
      3,
    ]);
  });

  it("Should output without keeper", async function () {
    const [account1] = await ethers.getSigners();
    const dest = "0x09FDAD54B23D937BDB6244341b24566e5F79309b";
    const id =
      "0x182bfe56740a85d5ee35abc07143bf0d9f9525c43de7a988c6d03fa79ccba7e6";

    const channel = await deployContract("ChannelERC20", [
      erc20.address,
      keeper.address,
    ]);

    {
      await initBalance(erc20, channel);
      // await printIdAndIndex(channel);
      await testOutput(channel, account1, id, dest);
      // await printIdAndIndex(channel);
      await assertBalanceEquals(erc20, dest);
    }
  });

  it("Should output with multi sig keeper", async function () {
    const [account1] = await ethers.getSigners();
    const dest = "0x09FDAD54B23D937BDB6244341b24566e5F79309b";
    const id =
      "0x182bfe56740a85d5ee35abc07143bf0d9f9525c43de7a988c6d03fa79ccba7e6";

    const channel = await deployContract("ChannelERC20", [
      erc20.address,
      keeperMultiSig.address,
    ]);

    {
      await multiSignId(keeperMultiSig, id);

      await initBalance(erc20, channel);
      // await printIdAndIndex(channel);
      await testOutput(channel, account1, id, dest);
      // await printIdAndIndex(channel);
      await assertBalanceEquals(erc20, dest);
    }
  });

  it("Should not output with multi sig keeper", async function () {
    const [account1] = await ethers.getSigners();
    const dest = "0x09FDAD54B23D937BDB6244341b24566e5F79309b";
    const id =
      "0x182bfe56740a85d5ee35abc07143bf0d9f9525c43de7a988c6d03fa79ccba7e6";

    const channel = await deployContract("ChannelERC20", [
      erc20.address,
      keeperMultiSig.address,
    ]);

    {
      await initBalance(erc20, channel);
      // await printIdAndIndex(channel);
      await testOutputRevert(channel, account1, id, dest, "revert id approved");
      // await printIdAndIndex(channel);
    }
  });
});

async function initBalance(_erc20, _channel) {
  await erc20.transfer(_channel.address, ethers.utils.parseEther("1.0"));
}

async function testOutput(_channel, _account, _id, _dest) {
  await expect(
    _channel
      .connect(_account)
      .output(_id, _dest, ethers.utils.parseEther("1.0"))
  )
    .to.emit(_channel, "Output")
    .withArgs(
      1,
      // ethers.utils.hexlify(keccak256("1")),
      _id,
      _dest,
      ethers.utils.parseEther("1.0")
    );
}

async function testOutputRevert(_channel, _account, _id, _dest, revertedMsg) {
  await expect(
    _channel
      .connect(_account)
      .output(_id, _dest, ethers.utils.parseEther("1.0"))
  ).to.be.revertedWith(revertedMsg);
}

async function printIdAndIndex(_channel) {
  console.log(await _channel.prevOutputId());
  console.log(await _channel.outputIndex());
}

async function assertBalanceEquals(_erc20, _dest) {
  const balance = await _erc20.balanceOf(_dest);
  assert.equal(balance.toString(), ethers.utils.parseEther("1.0").toString());
}

async function multiSignId(_keeper, _id) {
  const raw = ethers.utils.hexlify(_id);
  const keys = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  ];

  const sigs = [];

  keys.forEach((key) => {
    const signingKey = new ethers.utils.SigningKey(key);
    const signature = signingKey.signDigest(raw);
    signature.address = ethers.utils.computeAddress(
      ethers.utils.recoverPublicKey(raw, signature)
    );
    sigs.push(signature);
  });

  sigs.sort(function (a, b) {
    if (a.address < b.address) return -1;
    if (a.address > b.address) return 1;
    return 0;
  });

  const rArr = sigs.map((s) => s.r);
  const vArr = sigs.map((s) => s.v);
  const sArr = sigs.map((s) => s.s);

  await expect(_keeper.approveId(vArr, rArr, sArr, _id))
    .to.emit(_keeper, "Approved")
    .withArgs(_id);
}
