const vuilder = require("@vite/vuilder");
import config from "./deploy.config.json";



async function run(): Promise<void> {
  for(let i=0;i<10;i++){
	const keeper = vuilder.newAccount(config.deployer, i, undefined);
	console.log("deployer address", i, keeper.address);
  }
  return;
}

run().then(() => {
  console.log("done");
});
