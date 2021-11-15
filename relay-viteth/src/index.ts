import { Workflow } from "./channel/index";
import { channels } from "./config";

async function run() {
  const workflow = new Workflow(channels());

  await workflow.init();

  while (true) {
    await workflow.work();
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
