const cfg = require("./1deploy.config.json");
const hre = require("hardhat");
const ethers = hre.ethers;

async function deployContract(name, args) {
  let contractMode = await ethers.getContractFactory(name);
  let contractIns = await contractMode.deploy(...args);
  await contractIns.deployed();
  return contractIns;
}


async function attach(contract, address) {
  const factory = await ethers.getContractFactory(contract);
  return await factory.attach(address);
}

async function deploy() {
  const keeper = await deployContract("KeeperMultiSig", [
    cfg.keepers,
    cfg.threshold,
  ]);
  console.log("keeper deployed", keeper.address);

  const erc20 = await attach("ERC20Token", cfg.erc20);

  const vault = await deployContract("Vault", [keeper.address]);

  console.log("vault deployed", vault.address);
  await vault.newChannel(erc20.address, keeper.address, {});

  console.log("vault new channel success");
  const channelId = 1;
  // keeper deployed 0x0d090D438bA8F9e2380b0eFe687634361caD402F
  // vault deployed 0x6b90e3F5B0E2f4F2ec0872bE66955055eE3F72b2

  // const vault = await attach("Vault", "0x6b90e3F5B0E2f4F2ec0872bE66955055eE3F72b2")
  
  
  const channel = await vault.channels(channelId);
  console.log(channel);

  const result = {
    keeper: keeper.address,
    vault: vault.address,
    erc20: erc20.address,
    channelId: channelId,
    channelInputHash: channel.inputHash,
    channelOutputHash: channel.outputHash
  };
  console.log("result: ", JSON.stringify(result));

  const [owner] = await ethers.getSigners();

  await new Promise((resolve) => {
    setTimeout(resolve, 10000);
  });

  erc20.connect(owner);

  await erc20.mint(vault.address, ethers.utils.parseEther("10000"));
}

async function main() {
  await hre.run("compile");
  await deploy();
}

main().then(() => {
  console.log("deploy done");
});
