import { accountBlock } from "@vite/vitejs";
import { signAndSend } from "./provider";
import {
  awaitConfirmed,
  awaitReceived,
  mint,
  accountHeight,
  accountUnReceived,
} from "./node";
import { constant } from "@vite/vitejs";
const { Contracts, Vite_TokenId } = constant;

export async function deploy(
  provider: string,
  address: string,
  key: string,
  abi: Object | Array<Object>,
  code: string,
  {
    responseLatency = 0,
    quotaMultiplier = 10,
    randomDegree = 0,
    params,
  }: {
    responseLatency?: Number;
    quotaMultiplier?: Number;
    randomDegree?: Number;
    params?: string | Array<string | boolean | Object>;
  }
) {
  const block = accountBlock.createAccountBlock("createContract", {
    abi: abi,
    code: code,
    quotaMultiplier: quotaMultiplier,
    randomDegree: randomDegree,
    responseLatency: responseLatency,
    params: params,
    address: address,
  });
  return signAndSend(provider, block, key);
}

export async function stakeQuota(
  provider: any,
  address: string,
  key: string,
  beneficiaryAddress: string,
  amount = "5134000000000000000000"
) {
  const block = accountBlock.createAccountBlock("stakeForQuota", {
    address: address,
    beneficiaryAddress: beneficiaryAddress,
    amount: amount,
  });
  return signAndSend(provider, block, key);
}

export async function awaitReceive(
  provider: any,
  address: string,
  key: string,
  sendHash: string
) {
  const block = accountBlock.createAccountBlock("receive", {
    address: address,
    sendBlockHash: sendHash,
  });
  return signAndSend(provider, block, key);
}

export async function awaitDeployConfirmed(
  provider: any,
  address: string,
  key: string,
  abi: Object | Array<Object>,
  code: string,
  {
    responseLatency = 0,
    quotaMultiplier = 10,
    randomDegree = 0,
    params,
  }: {
    responseLatency?: Number;
    quotaMultiplier?: Number;
    randomDegree?: Number;
    params?: string | Array<string | boolean | Object>;
  }
) {
  const deployResult = await deploy(provider, address, key, abi, code, {
    responseLatency,
    quotaMultiplier,
    randomDegree,
    params,
  });
  {
    const sentBlock = await stakeQuota(
      provider,
      address,
      key,
      deployResult.toAddress
    );
    await mint(provider);
    await awaitReceived(provider, sentBlock.hash);
  }

  const receivedBlock = await awaitReceived(provider, deployResult.hash);

  await mint(provider);
  const confirmedBlock = await awaitConfirmed(
    provider,
    receivedBlock.receiveBlockHash
  );
  return { send: receivedBlock, receive: confirmedBlock };
}

export async function awaitDeploy(
  provider: any,
  address: string,
  key: string,
  abi: Object | Array<Object>,
  code: string,
  {
    responseLatency = 0,
    quotaMultiplier = 10,
    randomDegree = 0,
    params,
  }: {
    responseLatency?: Number;
    quotaMultiplier?: Number;
    randomDegree?: Number;
    params?: string | Array<string | boolean | Object>;
  }
) {
  const deployResult = await deploy(provider, address, key, abi, code, {
    responseLatency,
    quotaMultiplier,
    randomDegree,
    params,
  });

  const receivedBlock = await awaitReceived(provider, deployResult.hash);
  return { send: receivedBlock };
}

export class DeployedContract {
  address: string;
  abi: Array<{ name: string; type: string }>;
  offChainCode?: any;
  provider: any;

  constructor(
    provider: any,
    address: string,
    abi: Array<{ name: string; type: string }>,
    code?: any
  ) {
    this.provider = provider;
    this.abi = abi;
    this.address = address;
    this.offChainCode = Buffer.from(code, "hex").toString("base64");
  }

  async awaitCall(
    from: string,
    fromKey: string,
    methodName: string,
    params: any[],
    {
      tokenId = Vite_TokenId,
      amount = "0",
    }: { tokenId?: string; amount?: string }
  ) {
    const block = await this.call(from, fromKey, methodName, params, {
      tokenId,
      amount,
    });
    return await awaitReceived(this.provider, block.hash);
  }

  async call(
    from: string,
    fromKey: string,
    methodName: string,
    params: any[],
    {
      tokenId = Vite_TokenId,
      amount = "0",
    }: { tokenId?: string; amount?: string }
  ) {
    const methodAbi = this.abi.find((x) => {
      return x.name === methodName && x.type === "function";
    });
    if (!methodAbi) {
      throw new Error("method not found: " + methodName);
    }
    const block = accountBlock.createAccountBlock("callContract", {
      address: from,
      abi: methodAbi,
      toAddress: this.address,
      params: params,
      tokenId: tokenId,
      amount: amount,
    });
    return signAndSend(this.provider, block, fromKey);
  }

  async offChain(methodName: string, params: Array<any>) {
    const methodAbi = this.abi.find((x) => {
      return x.type === "offchain" && x.name === methodName;
    });
    if (!methodAbi) {
      throw new Error("method not found:" + methodName);
    }

    return this.provider.callOffChainContract({
      address: this.address,
      abi: methodAbi,
      code: this.offChainCode,
      params: params,
    });
  }
}
export async function awaitSend(
  provider: any,
  fromAddress: string,
  fromKey: string,
  toAddress: string,
  tokenId = "tti_5649544520544f4b454e6e40",
  amount = "0"
) {
  const block = accountBlock.createAccountBlock("send", {
    address: fromAddress,
    toAddress: toAddress,
    tokenId: tokenId,
    amount: amount,
  });
  const sentBlock = await signAndSend(provider, block, fromKey);
  return sentBlock;
}

// send amount to contract address
export async function awaitSendContract(
  provider: any,
  fromAddress: string,
  fromKey: string,
  toAddress: string,
  tokenId = "tti_5649544520544f4b454e6e40",
  amount = "0"
) {
  const block = accountBlock.createAccountBlock("send", {
    address: fromAddress,
    toAddress: toAddress,
    tokenId: tokenId,
    amount: amount,
  });
  const sentBlock = await signAndSend(provider, block, fromKey);
  const receivedBlock = await awaitReceived(provider, sentBlock.hash);
  await mint(provider);
  const confirmedBlock = await awaitConfirmed(
    provider,
    receivedBlock.receiveBlockHash
  );
  return { send: receivedBlock, receive: confirmedBlock };
}

export async function awaitReceiveAll(
  provider: any,
  account: string,
  accountKey: string
) {
  const blocks = await accountUnReceived(provider, account);
  if (blocks) {
    for (const block of blocks) {
      await awaitReceive(provider, account, accountKey, block.hash);
    }
  }
}

export async function awaitInitAccount(
  provider: any,
  from: string,
  fromKey: string,
  to: string,
  toKey: string
) {
  if ((await accountHeight(provider, to)) > 0) {
    return;
  }
  const stakeResult = stakeQuota(provider, from, fromKey, to);
  await stakeResult;

  const tokenId = "tti_5649544520544f4b454e6e40";
  const amount = "0";
  const block = accountBlock.createAccountBlock("send", {
    address: from,
    toAddress: to,
    tokenId: tokenId,
    amount: amount,
  });
  const sendResult = signAndSend(provider, block, fromKey);
  const receivedResult = awaitReceiveAll(provider, to, toKey);
  await sendResult;
  await receivedResult;
}
