import { provider } from "./provider";
import { selectAccount } from "./accounts";

export async function signAndSend(block: any, address: string) {
  const account = selectAccount(address);
  block.setProvider(provider).setPrivateKey(account.privateKey);
  await block.autoSetPreviousAccountBlock();
  const result = await block.sign().send();
  console.log("send success", result);
  return result;
}
