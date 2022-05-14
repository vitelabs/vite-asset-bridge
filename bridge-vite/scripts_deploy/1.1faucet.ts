import { expect } from "chai";
const vuilder = require("@vite/vuilder");
import config from "./deploy.config.json";

async function run(): Promise<void> {
  
  const provider = vuilder.newProvider(config.http);
  const deployer = vuilder.newAccount(config.deployer, 0, provider);

  await deployer.receiveAll();
  return;
}

run().then(() => {
  console.log("done");
});
