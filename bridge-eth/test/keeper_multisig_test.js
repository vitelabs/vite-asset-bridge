// test/keeper_multisig_test.js
// Load dependencies
const { use, expect, assert } = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers } = require('hardhat');
const keccak256 = require('keccak256');

const { encode } = require('rlp');
// const abi = require('ethereumjs-abi');

use(solidity);

let vault;
let keeper;

async function deployContract(name, args) {
  let contractMode = await ethers.getContractFactory(name);
  let contractIns = await contractMode.deploy(...args);
  await contractIns.deployed();
  return contractIns;
}

// Start test block
describe('MultiSigKeeper', function () {
  beforeEach(async function () {
    const [account1, account2, account3, account4, account5] = await ethers.getSigners();
    vault = await deployContract('Vault', []);
    keeper = await deployContract('MultiSigKeeper', [keccak256('vite_token_id'), vault.address,
    [account1.address, account2.address, account3.address, account4.address, account5.address],
      3
    ]);
    await vault.transferOwnership(keeper.address);
  });

  it('Should Owner', async function () {
    const owner = await vault.owner();
    assert.equal(keeper.address, owner);

    await expect(vault.input(keccak256('1'), ethers.constants.AddressZero, ethers.utils.parseEther("1.0")))
      .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('Should Input', async function () {
    const [account1, account2, account3] = await ethers.getSigners();
    await account1.sendTransaction({
      to: vault.address,
      value: ethers.utils.parseEther("1.0")
    });


    const salt = await keeper.SALT();
    const prevHash = await keeper.prevHash();
    const prov = ethers.provider;



    const dest = ethers.constants.AddressZero;
    const value = ethers.utils.parseEther("1.0");

    const raw = ethers.utils.hexlify(ethers.utils.solidityKeccak256(['bytes32', 'address', 'uint256', 'bytes32'], [salt, dest, value, prevHash]));

    const keys = [
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    ]

    const sigs = [];

    keys.forEach(key => {
      const signingKey = new ethers.utils.SigningKey(key);
      const signature = signingKey.signDigest(raw);
      signature.address = ethers.utils.computeAddress(ethers.utils.recoverPublicKey(raw, signature));
      sigs.push(signature);
    });

    sigs.sort(function (a, b) {
      if (a.address < b.address) return -1;
      if (a.address > b.address) return 1;
      return 0;
    });

    // sigs.forEach(async function (sig) {
    //   console.log(sig.address);
    // });

    // console.log(account1.address, account2.address, account3.address);

    const rArr = sigs.map(s => s.r);
    const vArr = sigs.map(s => s.v);
    const sArr = sigs.map(s => s.s);



    const balanceOfZeroBefore = await prov.getBalance(dest);

    // await vault.input(keccak256('1'), account1.address, ethers.utils.parseEther("1.0"));
    await expect(keeper.submitInput(vArr, rArr, sArr, dest, ethers.utils.parseEther("1.0")))
      .to.emit(vault, 'Input')
      .withArgs(ethers.utils.hexlify(raw), dest, ethers.utils.parseEther("1.0"));

    // const events = await vault.queryFilter(vault.filters.Input(), 0, 1000)
    // console.log(events);

    const balance = await prov.getBalance(vault.address);
    assert.equal(balance.toString(), ethers.utils.parseEther("0").toString());

    const balanceOfZero = await prov.getBalance(dest);
    assert.equal((balanceOfZero - balanceOfZeroBefore).toString(), ethers.utils.parseEther("1.0").toString());


    const hash = await keeper.prevHash();
    assert.equal(hash.toString(), raw.toString());
  });
});


