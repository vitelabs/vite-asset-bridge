import { accountBlock } from "@vite/vitejs";
import { signAndSend } from "./sender";
import { awaitConfirmed, awaitReceived, mint } from "./node";
import { constant } from "@vite/vitejs";
import { provider } from "./provider";
const { Contracts, Vite_TokenId } = constant;

export async function deploy(
  address: string,
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
    params?: string | Array<string | boolean>;
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
  return signAndSend(block, address);
}

export async function stakeQuota(address: string, beneficiaryAddress: string) {
  const block = accountBlock.createAccountBlock("stakeForQuota", {
    address: address,
    beneficiaryAddress: beneficiaryAddress,
    amount: "5134000000000000000000",
  });
  return signAndSend(block, address);
}

export async function awaitDeploy(
  address: string,
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
    params?: string | Array<string | boolean>;
  }
) {
  const deployResult = await deploy(address, abi, code, {
    responseLatency,
    quotaMultiplier,
    randomDegree,
    params,
  });
  {
    const sentBlock = await stakeQuota(address, deployResult.toAddress);
    await mint();
    await awaitReceived(sentBlock.hash);
  }

  const receivedBlock = await awaitReceived(deployResult.hash);

  await mint();
  const confirmedBlock = await awaitConfirmed(receivedBlock.receiveBlockHash);
  return { send: receivedBlock, receive: confirmedBlock };
}

export class DeployedContract {
  address: string;
  abi: Array<{ name: string; type: string }>;
  offChainCode?: any;

  constructor(
    address: string,
    abi: Array<{ name: string; type: string }>,
    code?: any
  ) {
    this.abi = abi;
    this.address = address;
    this.offChainCode = Buffer.from(code, "hex").toString("base64");
  }

  async awaitCall(
    from: string,
    methodName: string,
    params: any[],
    {
      tokenId = Vite_TokenId,
      amount = "0",
    }: { tokenId?: string; amount?: string }
  ) {
    const block = await this.call(from, methodName, params, {
      tokenId,
      amount,
    });
    return await awaitReceived(block.hash);
  }

  async call(
    from: string,
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
    return signAndSend(block, from);
  }

  async offChain(methodName: string, params: Array<any>) {
    const methodAbi = this.abi.find((x) => {
      return x.type === "offchain" && x.name === methodName;
    });
    if (!methodAbi) {
      throw new Error("method not found:" + methodName);
    }

    return provider.callOffChainContract({
      address: this.address,
      abi: methodAbi,
      code: this.offChainCode,
      params: params,
    });
  }
}

// send amount to address
export async function awaitSend(
  fromAddress: string,
  toAddress: string,
  tokenId: string,
  amount: string
) {
  const block = accountBlock.createAccountBlock("send", {
    address: fromAddress,
    toAddress: toAddress,
    tokenId: tokenId,
    amount: amount,
  });
  const sentBlock = await signAndSend(block, fromAddress);
  const receivedBlock = await awaitReceived(sentBlock.hash);
  await mint();
  const confirmedBlock = await awaitConfirmed(receivedBlock.receiveBlockHash);
  return { send: receivedBlock, receive: confirmedBlock };
}
