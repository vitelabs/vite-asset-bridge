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
import { mergeConfig } from "./config";


export class Indexer {
  cfg: any;
  contractTokenMapping: Map<string, string>;

  constructor(cfg: any) {
    this.cfg = cfg;
    this.contractTokenMapping = new Map<string, string>();
    for (const event of cfg.events) {
      this.contractTokenMapping.set(event.address, event.token);
    }
  }
}


yargs(hideBin(process.argv))
  .command(
    "index <config> <abis>",
    "the contents of the URL",
    () => {},
    async (argv: any) => {
      await runWith(argv.config, argv.abis);
    }
  )
  .demandCommand(1)
  .parse();

async function runWith(cfgPath: string, abisCfg: string) {
  const cfg = json(cfgPath);
  const abis = json(abisCfg);

  const mergedCfg = mergeConfig(cfg, abis);
  const db = new EventsDB();

  scanWith(db, mergedCfg);

  startWebAppWith(db, mergedCfg, new Indexer(mergedCfg));
}

function json(filename: string) {
  if (!fs.existsSync(filename)) {
    throw new Error(`config file is not exists. path:${filename}`);
  }
  const json = fs.readFileSync(filename);
  let cfg;
  try {
    cfg = JSON.parse(json.toString());
  } catch (e) {
    throw new Error(`parse config fail, content:${json}`);
  }
  return cfg;
}
