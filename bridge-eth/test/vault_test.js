// test/vault_test.js
// Load dependencies
const { use, expect, assert } = require("chai");
const { solidity } = require("ethereum-waffle");
const { ethers } = require("hardhat");
const keccak256 = require("keccak256");
const { wallet } = require("@vite/vitejs");

use(solidity);

let vault;
let erc20;
let accounts;

async function deployContract(name, args) {
  let contractMode = await ethers.getContractFactory(name);
  let contractIns = await contractMode.deploy(...args);
  await contractIns.deployed();
  return contractIns;
}

// Start test block
describe("Vault Inputs Outputs", function () {
  before(async () => {
    accounts = await ethers.getSigners();
  });
  beforeEach(async function () {
    keeper = await deployContract("KeeperMultiSig", [
      [accounts[0].address, accounts[1].address, accounts[2].address],
      3,
    ]);
    erc20 = await deployContract("ERC20Token", ["TTT", "TTTT"]);
    vault = await deployContract("Vault", [keeper.address]);

    await expect(vault.newChannel(erc20.address, keeper.address, {}))
      .to.emit(vault, "LogChannelsAddition")
      .withArgs(1, erc20.address);

    await expect(vault.newChannel(erc20.address, keeper.address, {}))
      .to.emit(vault, "LogChannelsAddition")
      .withArgs(2, erc20.address);
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
    const channel = await vault.channels(1);
    const prevHash = channel.inputHash;

    const id = ethers.utils.solidityKeccak256(
      ["uint256", "bytes", "uint256", "bytes32"],
      [0, dest, value, prevHash]
    );

    console.log("id:", id);
    console.log("value:", ethers.utils.parseEther("1.0").toString());

    await erc20.mint(account1.address, value);
    await erc20.approve(vault.address, value);
    await expect(vault.input(1, dest, value))
      .to.emit(vault, "Input")
      .withArgs(1, 1, id, ethers.utils.hexlify(dest), value, account1.address);

    const balance = await erc20.balanceOf(vault.address);

    assert.equal(balance.toString(), ethers.utils.parseEther("1.0").toString());
  });

  // it("Should output without keeper", async function () {
  //   const [account1] = await ethers.getSigners();
  //   const dest = "0x09FDAD54B23D937BDB6244341b24566e5F79309b";

  //   const value = ethers.utils.parseEther("1.0");
  //   const channel = await vault.channels(1);
  //   const prevHash = channel.outputHash;

  //   const id = ethers.utils.solidityKeccak256(
  //     ["uint256", "bytes", "uint256", "bytes32"],
  //     [0, dest, value, prevHash]
  //   );

  //   {
  //     await initBalance(erc20, vault);
  //     // await printIdAndIndex(channel);
  //     await testOutput(vault, account1, id, dest);
  //     // await printIdAndIndex(channel);
  //     await assertBalanceEquals(erc20, dest);
  //   }
  // });

  it("Should inputs", async function () {
    const [account1] = await ethers.getSigners();

    vault.connect(account1);
    erc20.connect(account1);

    const channelId = 1;
    const inputs = [
      {
        dest: "vite_cecce91eb5ed40879105e1c780c572d087bb6ec91db043f422",
        value: "0.24",
      },
      {
        dest: "vite_cecce91eb5ed40879105e1c780c572d087bb6ec91db043f422",
        value: "0.25",
      },
    ];

    const sum = ethers.utils.parseEther(
      inputs
        .map((t) => t.value)
        .reduce((part, val) => part + parseFloat(val), 0)
        .toString()
    );
    console.log(sum.toString());

    await erc20.mint(account1.address, sum);
    await erc20.approve(vault.address, sum);

    const channel = await vault.channels(channelId);
    const prevInputHash = channel.inputHash;
    const prevInputId = channel.inputId;
    console.log(JSON.stringify([+prevInputId, prevInputHash]));

    for (let i = 0; i < inputs.length; i++) {
      await input(account1.address, vault, channelId, inputs[i]);
    }
  });

  it("Should outputs", async function () {
    const [account1] = await ethers.getSigners();

    vault.connect(account1);
    erc20.connect(account1);

    const channelId = 1;
    const outputs = [
      {
        dest: "0x09FDAD54B23D937BDB6244341b24566e5F79309b",
        value: "0.24",
      },
      {
        dest: "0x09FDAD54B23D937BDB6244341b24566e5F79309b",
        value: "0.25",
      },
    ];

    const sum = ethers.utils.parseEther(
      outputs
        .map((t) => t.value)
        .reduce((part, val) => part + parseFloat(val), 0)
        .toString()
    );

    await erc20.mint(vault.address, sum);

    outputs.forEach((output) => {
      // output.dest = ethers.utils.hexlify(output.dest);
      output.value = ethers.utils.parseEther(output.value);
    });

    const channel = await vault.channels(channelId);
    const prevInputHash = channel.inputHash;
    const prevInputId = channel.inputId;
    console.log(JSON.stringify([+prevInputId, prevInputHash]));

    for (let i = 0; i < outputs.length; i++) {
      await approveAndExecOutput(keeper, vault, channelId, outputs[i]);
    }
  });
});

async function input(sender, vault, channelId, input) {
  // console.log(input.dest, input.value);
  const destOriginHex = "0x" + wallet.getOriginalAddressFromAddress(input.dest);
  const value = ethers.utils.parseEther(input.value);
  const channel = await vault.channels(channelId);
  const prevInputHash = channel.inputHash;
  const inputId = channel.inputId;

  const inputHash = ethers.utils.solidityKeccak256(
    ["uint256", "bytes", "uint256", "bytes32"],
    [inputId, destOriginHex, value, prevInputHash]
  );

  const beforeBalance = await erc20.balanceOf(vault.address);
  await expect(vault.input(channelId, destOriginHex, value))
    .to.emit(vault, "Input")
    .withArgs(
      1,
      +inputId + 1,
      inputHash,
      ethers.utils.hexlify(destOriginHex),
      value,
      sender
    );

  console.log(
    JSON.stringify([+inputId + 1, inputHash, input.dest, value.toString()])
  );

  const afterBalance = await erc20.balanceOf(vault.address);

  assert.equal((afterBalance - beforeBalance).toString(), value.toString());
}

async function approveAndExecOutput(_keeper, vault, channelId, _output) {
  const channel = await vault.channels(channelId);

  const nextOutputHash = ethers.utils.solidityKeccak256(
    ["uint256", "address", "uint256", "bytes32"],
    [channel.outputId, _output.dest, _output.value, channel.outputHash]
  );
  _output.hash = nextOutputHash;
  const { rArr, vArr, sArr } = await generateSignatures(_output.hash);

  // expect(nextOutputHash).to.be.equal(_output.hash);
  // console.log(_output.hash,_output.dest);
  const beforeBalance = await erc20.balanceOf(vault.address);

  await expect(
    _keeper.approveAndExecOutput(
      vArr,
      rArr,
      sArr,
      channelId,
      _output.hash,
      _output.dest,
      _output.value,
      vault.address
    )
  )
    .to.emit(_keeper, "Approved")
    .withArgs(_output.hash)
    .to.emit(vault, "Output")
    .withArgs(1, +channel.outputId + 1, _output.hash, _output.dest, _output.value);


    const afterBalance = await erc20.balanceOf(vault.address);
    // console.log(afterBalance.toString(), beforeBalance.toString(), _output.value.toString());

    assert.equal((beforeBalance - afterBalance).toString(), _output.value.toString());
}

async function generateSignatures(_id) {
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
    // console.log(signature.v, signature.r, signature.s);
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
