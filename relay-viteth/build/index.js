"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const index_1 = require("./channel/index");
const jsonCfg = process.env.JSON_RELAY_CONFIG;
async function run() {
    if (!jsonCfg) {
        throw new Error("JSON_RELAY_CONFIG environment variable not set");
    }
    if (!fs_1.default.existsSync(jsonCfg)) {
        throw new Error("config file not found, " + jsonCfg);
    }
    const cfg = JSON.parse(fs_1.default.readFileSync(jsonCfg).toString());
    const workflow = new index_1.Workflow(cfg);
    await workflow.init();
    while (true) {
        await workflow.work();
        await sleep(10000);
    }
}
function sleep(ms) {
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
