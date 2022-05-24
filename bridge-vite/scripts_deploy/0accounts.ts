import * as vuilder from "@vite/vuilder";
import config from "./keepers.config.json";



async function run(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const keeper = vuilder.newAccount(config.keeper, i, undefined);
    console.log("address", i, keeper.address);
  }

  for (const i of config.indexArr) {
    const keeper = vuilder.newAccount(config.keeper, i, undefined);
    console.log("keeeper address", `"${keeper.address}",`)
  }

  return;
}

run().then(() => {
  console.log("done");
});
