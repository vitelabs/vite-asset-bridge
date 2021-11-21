// var argv = require("minimist")(process.argv.slice(2));
// console.log(argv);

// async function run() {}

// function sleep(ms: number) {
//   return new Promise((resolve) => {
//     setTimeout(resolve, ms);
//   });
// }

// async function main() {
//   await run();
// }

// main();

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs";
import { EventsDB, scanWith } from "./events";
import { startWebAppWith } from "./server";

yargs(hideBin(process.argv))
  .command(
    "index <config>",
    "the contents of the URL",
    () => {},
    async (argv: any) => {
      await runWith(argv.config);
    }
  )
  .demandCommand(1)
  .parse();

async function runWith(cfgPath: string) {
  if (!fs.existsSync(cfgPath)) {
    throw new Error(`config file is not exists. path:${cfgPath}`);
  }
  const json = fs.readFileSync(cfgPath);
  let cfg;
  try {
    cfg = JSON.parse(json.toString());
  } catch (e) {
    throw new Error(`parse config fail, content:${json}`);
  }
  const db = new EventsDB();
  scanWith(db, cfg);

  startWebAppWith(db);
}
