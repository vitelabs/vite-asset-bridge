import { ethers } from "ethers";

export interface ChannelOptions {
  network: string;
  channelId: string;
  tokenId: string;
}

export interface WorkflowOptions {
  from: ChannelOptions;
  to: ChannelOptions;
}

interface EndpointCfg {
  type: string;
  url: string;
  network: string;
  key: string;
}

export function newEtherProvider(cfg: EndpointCfg) {
  if (cfg.type === "infura") {
    return new ethers.providers.InfuraProvider(cfg.network, cfg.key);
  } else if (cfg.type === "dev") {
    return new ethers.providers.JsonRpcProvider(cfg.url);
  }
  throw new Error("error endpoint config");
}

export function privateKey(cfg: any) {
  // if (!cfg.address) {
  //   throw new Error("error account.address");
  // }
  if (cfg.mnemonic) {
    if (cfg.index === undefined) {
      throw new Error("error mnemonic index");
    }

    const path = `m/44'/60'/0'/0/${cfg.index}`;
    const wallet = ethers.Wallet.fromMnemonic(cfg.mnemonic, path);
    // if (wallet.address != cfg.address) {
    //   throw new Error(`error address:${cfg.address},${wallet.address}`);
    // }
    return wallet.privateKey;
  }
  if (cfg.privateKey) {
    const wallet = new ethers.Wallet(cfg.privateKey);
    // if (wallet.address != cfg.address) {
    //   throw new Error(`error address:${cfg.address},${wallet.address}`);
    // }
    return wallet.privateKey;
  }
  throw new Error("error account");
}

export function toWorkflowOptions(
  options: ChannelOptions[][],
  limits: string[]
): Map<string, WorkflowOptions[]> {
  // todo: implement

  const result = new Map<string, WorkflowOptions[]>();
  const limitSet = new Set(limits);
  for (const option of options) {
    if (option.length != 2) {
      throw new Error(`error channelOptions`);
    }
    for (const channel of option) {
      if (!limitSet.has(channel.network)) {
        throw new Error(`not support ${channel.network}`);
      }
    }
    pushIfNotExists(result, option[0], option[1]);
    pushIfNotExists(result, option[1], option[0]);
  }
  return result;
}

function pushIfNotExists(
  m: Map<string, WorkflowOptions[]>,
  from: ChannelOptions,
  to: ChannelOptions
) {
  const { key, workflow } = generateWorkflow(from, to);
  let flows = m.get(key);
  if (flows) {
    flows.push(workflow);
  } else {
    flows = [];
    flows.push(workflow);
    m.set(key, flows);
  }
}

function generateWorkflow(from: ChannelOptions, to: ChannelOptions) {
  return {
    key: `${from.network}-${to.network}`,
    workflow: { from, to } as WorkflowOptions,
  };
}

export function toJobs(
  options: WorkflowOptions[],
  from: string,
  to: string
): Map<string, ChannelOptions> {
  const jobs = new Map<string, ChannelOptions>();
  for (const option of options) {
    if (option.from.network != from || option.to.network != to) {
      throw new Error(`error workflow options`);
    }
    jobs.set(option.from.channelId, option.to);
  }
  return jobs;
}

export interface SenderMeta {
  nonce: number;
}

export interface TxRecord {
  signedTx: string;
  hash: string;
}

export interface LogEvent {
  height: number;
  txIndex: number;
  logIndex: number;
}
export interface InputEvent extends LogEvent {
  channelId: string;
  index: number;
  inputHash: string;
  dest: string;
  value: string;
}

export interface StoredLogIndex extends LogEvent {
  inputsIndex: { [k: string]: number };
}

export function logCompare(x: LogEvent, y: LogEvent): number {
  if (x.height < y.height) {
    return -1;
  } else if (x.height > y.height) {
    return 1;
  }

  if (x.txIndex < y.txIndex) {
    return -1;
  } else if (x.txIndex > y.txIndex) {
    return 1;
  }

  if (x.logIndex < y.logIndex) {
    return -1;
  } else if (x.logIndex > y.logIndex) {
    return 1;
  }
  return 0;
}

export function checkInputIndex(input: InputEvent, storedInputs: StoredLogIndex): boolean {
  const storedIndex = storedInputs.inputsIndex[input.channelId];
  if (!storedIndex && input.index === 1) {
    return true;
  }
  if (storedIndex && input.index === storedIndex + 1) {
    return true;
  }
  return false;
}