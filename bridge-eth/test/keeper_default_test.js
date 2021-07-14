// test/vault_test.js
// Load dependencies
const { use, expect, assert } = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers } = require('hardhat');
const keccak256 = require('keccak256')

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
describe('DefaultKeeper', function () {
  beforeEach(async function () {
    vault = await deployContract('Vault', []);
    keeper = await deployContract('DefaultKeeper', [vault.address]);
    await vault.transferOwnership(keeper.address);
  });

  it('Should Owner', async function () {
    const owner = await vault.owner();
    assert.equal(keeper.address, owner);

    await expect(vault.input(keccak256('1'), ethers.constants.AddressZero, ethers.utils.parseEther("1.0")))
      .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('Should Input', async function () {
    const [account1] = await ethers.getSigners();
    const prov = ethers.provider;

    await account1.sendTransaction({
      to: vault.address,
      value: ethers.utils.parseEther("1.0")
    });


    const dest = ethers.constants.AddressZero

    const balanceOfZeroBefore = await prov.getBalance(dest);

    // await vault.input(keccak256('1'), account1.address, ethers.utils.parseEther("1.0"));
    await expect(keeper.connect(account1).input(keccak256('1'), dest, ethers.utils.parseEther("1.0")))
      .to.emit(vault, 'Input')
      .withArgs(ethers.utils.hexlify(keccak256('1')), dest, ethers.utils.parseEther("1.0"));

    const balance = await prov.getBalance(vault.address);
    assert.equal(balance.toString(), ethers.utils.parseEther("0").toString());

    const balanceOfZero = await prov.getBalance(dest);
    assert.equal((balanceOfZero - balanceOfZeroBefore).toString(), ethers.utils.parseEther("1.0").toString());
  });
});
