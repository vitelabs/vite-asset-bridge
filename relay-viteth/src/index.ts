import fs from "fs";
import { Workflow } from "./channel/index";

const jsonCfg = process.env.JSON_RELAY_CONFIG;
const dataDir = process.env.DATA_DIR;

async function run() {
  if (!jsonCfg) {
    throw new Error("JSON_RELAY_CONFIG environment variable not set");
  }
  if (!fs.existsSync(jsonCfg)) {
    throw new Error("config file not found, " + jsonCfg);
  }

  const cfg = JSON.parse(fs.readFileSync(jsonCfg).toString());
  const workflow = new Workflow(cfg, dataDir);

  await workflow.init();

  while (true) {
    try{
      await workflow.work();
    }catch (err) {
      console.error(err);
    }
    await sleep(10000);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

run()
  .catch((e) => {
    console.log(e);
    console.log(typeof e);
  })
  .then(() => {
    console.log("done");
  });
