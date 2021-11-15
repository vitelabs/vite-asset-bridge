import { mint } from "../src/node";
import { newProvider } from "../src/provider";
import cfg from "./config.json";

async function main() {
  const provider = newProvider(cfg.url);
  await mint(provider);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .then(() => {
    console.log("mine done");
  });
