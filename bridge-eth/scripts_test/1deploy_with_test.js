const cfg = require("./1deploy.config.json");
const hre = require("hardhat");
const ethers = hre.ethers;

const ethDecimalDiff = 0;
const ethMinValue = "100000000000000000" // 0.1
const ethMaxValue = "10000000000000000000"; // 10

async function deployContract(name, args) {
  let contractMode = await ethers.getContractFactory(name);
  let contractIns = await contractMode.deploy(...args);
  await contractIns.deployed();
  return contractIns;
}

async function deploy() {
  const keeper = await deployContract("KeeperMultiSig", [
    cfg.keepers,
    cfg.threshold,
  ]);

  const vault = await deployContract("Vault", [keeper.address, ethDecimalDiff, ethMinValue, ethMaxValue]);

  const erc20 = await deployContract("ERC20Token", ["TTT", "TTTT"]);

  const decimalDiff = 0; 
  const minValue = "100000000000000000" 
  const maxValue = "10000000000000000000";
  const channelId = 1;

  await vault.newChannel(erc20.address, keeper.address, decimalDiff, minValue , maxValue, {});

  const channel = await vault.channels(channelId);

  const [owner] = await ethers.getSigners();

  await erc20.mint(vault.address, ethers.utils.parseEther("2.4"));
  await erc20.mint(owner.address, ethers.utils.parseEther("33"));


  // keeper need to submit signature
  await owner.sendTransaction({to: cfg.keepers[0], value: ethers.utils.parseEther("1.2")})

  const result = {
    keeper: keeper.address,
    vault: vault.address,
    erc20: erc20.address,
    channelId: channelId,
    channelInputHash: channel.inputHash,
    channelOutputHash: channel.outputHash
  };
  console.log("result: ", JSON.stringify(result));
}

async function main() {
  await hre.run("compile");
  await deploy();
}

main().then(() => {
  console.log("deploy done");
});
