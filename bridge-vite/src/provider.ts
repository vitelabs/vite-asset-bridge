import { ViteAPI } from "@vite/vitejs";
const { HTTP_RPC } = require("@vite/vitejs-http");

export function newProvider(url: string) {
  // connect to node
  const _provider = new ViteAPI(new HTTP_RPC(url), () => {
    console.log("provider connected");
  });
  return _provider;
}

export async function signAndSend(
  provider: any,
  block: any,
  privateKey: string
) {
  block.setProvider(provider).setPrivateKey(privateKey);
  await block.autoSetPreviousAccountBlock();
  const result = await block.sign().send();
  console.log("send success", result);
  return result;
}
