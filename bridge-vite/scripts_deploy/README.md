# scripts_deploy
deploy contracts on buidl test network 

```
cd bridge-vite

npx ts-node scripts_deploy/0accounts.ts

npx ts-node scripts_deploy/1.0deploy.ts

npx ts-node scripts_deploy/1.1faucet.ts

npx ts-node scripts_deploy/1.2stake_quota.ts  

npx ts-node scripts_deploy/1.3new_keeper.ts

npx ts-node scripts_deploy/2new_channel.ts

npx ts-node scripts_deploy/2print_channels.ts 

```