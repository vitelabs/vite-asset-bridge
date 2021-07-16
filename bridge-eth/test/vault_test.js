// test/vault_test.js
// Load dependencies
const { use, expect, assert } = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers } = require('hardhat');
const keccak256 = require('keccak256')

use(solidity);

let vault;

async function deployContract(name, args) {
  let contractMode = await ethers.getContractFactory(name);
  let contractIns = await contractMode.deploy(...args);
  await contractIns.deployed();
  return contractIns;
}

// Start test block
describe('Vault Inputs Outputs', function () {
  beforeEach(async function () {
    vault = await deployContract('Vault', [keccak256('0x123')]);
  });

  it('Should transfer', async function () {
    const [account1] = await ethers.getSigners();
    const prov = ethers.provider;

    await account1.sendTransaction({
      to: vault.address,
      value: ethers.utils.parseEther("1.0")
    });
    const balance = await prov.getBalance(vault.address);

    assert.equal(balance.toString(), ethers.utils.parseEther("1.0").toString());
  });

  it('Should output', async function () {
    const [account1] = await ethers.getSigners();
    const prov = ethers.provider;

    vault.connect(account1);

    const dest = 0x123;
    const value = ethers.utils.parseEther("1.0");
    const prevHash = await vault.prevId();

    const id = ethers.utils.solidityKeccak256(['bytes32', 'bytes', 'uint256', 'bytes32'], [keccak256('0x123'), dest, value, prevHash]);

    // await vault.output(account1.address, 0x123, ethers.utils.parseEther("1.0"), { value: ethers.utils.parseEther("1.0") })
    await expect(vault.output(account1.address, dest, value, { value: value }))
      .to.emit(vault, 'Output')
      .withArgs(id, account1.address, ethers.utils.hexlify(dest), value);

    // const events = await vault.queryFilter(vault.filters.Output(), 0, 1000)
    // console.log(events);


    const balance = await prov.getBalance(vault.address);

    assert.equal(balance.toString(), ethers.utils.parseEther("1.0").toString());
  });


  it('Should input', async function () {
    const [account1] = await ethers.getSigners();
    const prov = ethers.provider;

    await account1.sendTransaction({
      to: vault.address,
      value: ethers.utils.parseEther("1.0")
    });


    const dest = ethers.constants.AddressZero

    const balanceOfZeroBefore = await prov.getBalance(dest);

    // await vault.input(keccak256('1'), account1.address, ethers.utils.parseEther("1.0"));
    await expect(vault.connect(account1).input(keccak256('1'), dest, ethers.utils.parseEther("1.0")))
      .to.emit(vault, 'Input')
      .withArgs(ethers.utils.hexlify(keccak256('1')), dest, ethers.utils.parseEther("1.0"));

    // const events = await vault.queryFilter(vault.filters.Input(), 0, 1000)
    // console.log(events);

    const balance = await prov.getBalance(vault.address);
    assert.equal(balance.toString(), ethers.utils.parseEther("0").toString());

    const balanceOfZero = await prov.getBalance(dest);
    assert.equal((balanceOfZero - balanceOfZeroBefore).toString(), ethers.utils.parseEther("1.0").toString());

  });


  it('Should input revert', async function () {
    const [account1, other] = await ethers.getSigners();
    const prov = ethers.provider;

    await account1.sendTransaction({
      to: vault.address,
      value: ethers.utils.parseEther("1.0")
    });

    const dest = ethers.constants.AddressZero

    const balanceOfZeroBefore = await prov.getBalance(dest);

    await expect(vault.connect(other).input(keccak256('1'), dest, ethers.utils.parseEther("1.0")))
      .to.be.revertedWith('Ownable: caller is not the owner');

    const balance = await prov.getBalance(vault.address);
    assert.equal(balance.toString(), ethers.utils.parseEther("1.0").toString());

    const balanceOfZero = await prov.getBalance(dest);
    assert.equal((balanceOfZero - balanceOfZeroBefore).toString(), ethers.utils.parseEther("0").toString());
  });

});
