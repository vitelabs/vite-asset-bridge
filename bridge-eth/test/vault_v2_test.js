// test/vault_test.js
// Load dependencies
const { use, expect, assert } = require("chai");
const { solidity } = require("ethereum-waffle");
const { ethers } = require("hardhat");
const keccak256 = require("keccak256");

use(solidity);

let vault;
let erc20;

async function deployContract(name, args) {
  let contractMode = await ethers.getContractFactory(name);
  let contractIns = await contractMode.deploy(...args);
  await contractIns.deployed();
  return contractIns;
}

// Start test block
describe("Vault Inputs Outputs", function () {
  beforeEach(async function () {
    erc20 = await deployContract("ERC20Token", ["TTT","TTTT"]);
    vault = await deployContract("Vault", []);
    keeper = await deployContract("KeeperNone", []);

    await expect(vault.newChannel(erc20.address, keeper.address, {}))
    .to.emit(vault, "LogChannelsAddition")
    .withArgs(0, erc20.address);

    await expect(vault.newChannel(erc20.address, keeper.address, {}))
    .to.emit(vault, "LogChannelsAddition")
    .withArgs(1, erc20.address);
  });

  it("Should transfer", async function () {
    const [account1] = await ethers.getSigners();
    const prov = ethers.provider;

    await account1.sendTransaction({
      to: vault.address,
      value: ethers.utils.parseEther("1.0"),
    });
    const balance = await prov.getBalance(vault.address);

    assert.equal(balance.toString(), ethers.utils.parseEther("1.0").toString());
  });

  it("Should input", async function () {
    const [account1] = await ethers.getSigners();

    vault.connect(account1);
    erc20.connect(account1);

    const dest = "0x40996a2ba285ad38930e09a43ee1bd0d84f756f600";
    const value = ethers.utils.parseEther("1.0");
    const channel = await vault.channels(0);
    const prevHash = channel.inputHash;

    const id = ethers.utils.solidityKeccak256(
      ["uint256", "bytes", "uint256", "bytes32"],
      [0, dest, value, prevHash]
    );

    console.log("id:", id);
    console.log("value:", ethers.utils.parseEther("1.0").toString());

    await erc20.mint(account1.address, value);
    await erc20.approve(vault.address, value);
    await expect(vault.input(0, dest, value))
      .to.emit(vault, "Input")
      .withArgs(1, id, ethers.utils.hexlify(dest), value, account1.address);

    const balance = await erc20.balanceOf(vault.address);

    assert.equal(balance.toString(), ethers.utils.parseEther("1.0").toString());
  });


  it("Should output without keeper", async function () {
    const [account1] = await ethers.getSigners();
    const dest = "0x09FDAD54B23D937BDB6244341b24566e5F79309b";

    const value = ethers.utils.parseEther("1.0");
    const channel = await vault.channels(0);
    const prevHash = channel.outputHash;

    const id = ethers.utils.solidityKeccak256(
      ["uint256", "bytes", "uint256", "bytes32"],
      [0, dest, value, prevHash]
    );

    {
      await initBalance(erc20, vault);
      // await printIdAndIndex(channel);
      await testOutput(vault, account1, id, dest);
      // await printIdAndIndex(channel);
      await assertBalanceEquals(erc20, dest);
    }
  });

});

async function initBalance(_erc20, _vault) {
  await erc20.mint(_vault.address, ethers.utils.parseEther("1.0"));
}

async function testOutput(_vault, _account, _id, _dest) {
  await expect(
    _vault
      .connect(_account)
      .output(0, _id, _dest, ethers.utils.parseEther("1.0"))
  )
    .to.emit(_vault, "Output")
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
  const { rArr, vArr, sArr } = generateSignId(_keeper, _id);

  await expect(_keeper.approveId(vArr, rArr, sArr, _id))
    .to.emit(_keeper, "Approved")
    .withArgs(_id);
}

async function multiSignIdAndOutput(_keeper, _channel, _account, _id, _dest) {
  const { rArr, vArr, sArr } = generateSignId(_keeper, _id);

  await expect(
    _keeper.approveAndExecOutput(
      vArr,
      rArr,
      sArr,
      _id,
      _dest,
      ethers.utils.parseEther("1.0"),
      _channel.address
    )
  )
    .to.emit(_keeper, "Approved")
    .withArgs(_id)
    .to.emit(_channel, "Output")
    .withArgs(
      1,
      // ethers.utils.hexlify(keccak256("1")),
      _id,
      _dest,
      ethers.utils.parseEther("1.0")
    );
}

function generateSignId(_keeper, _id) {
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
    console.log(signature.v, signature.r, signature.s);
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
  return {
    rArr,
    vArr,
    sArr,
  };
}

