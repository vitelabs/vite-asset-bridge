import { ViteAPI } from "@vite/vitejs";
const { HTTP_RPC } = require("@vite/vitejs-http");
import * as cfg from "./config";

// connect to node
const _provider = new ViteAPI(new HTTP_RPC(cfg.network.url), () => {
  console.log("provider connected");
});

export const provider = _provider;
