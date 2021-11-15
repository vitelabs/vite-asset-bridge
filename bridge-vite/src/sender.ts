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
