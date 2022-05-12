# scripts_deploy
deploy contracts on rinkeby network 

```
cd bridge-eth

npx hardhat run scripts_deploy/0accounts.js --network rinkeby

npx hardhat run scripts_deploy/0token_init.js --network rinkeby 
 
npx hardhat run scripts_deploy/1deploy.js --network rinkeby 

npx hardhat run scripts_deploy/2new_channel.js --network rinkeby

npx hardhat run scripts_deploy/2print_channels.js --network rinkeby 

npx hardhat run scripts_deploy/3transfer_erc20_to_vault.js --network rinkeby

```