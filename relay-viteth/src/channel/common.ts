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
  if (!cfg.address) {
    throw new Error("error account.address");
  }
  if (cfg.mnemonic) {
    if (!cfg.index) {
      throw new Error("error mnemonic index");
    }

    const path = `m/44'/60'/0'/0/${cfg.index}`;
    const wallet = ethers.Wallet.fromMnemonic(cfg.mnemonic, path);
    if (wallet.address != cfg.address) {
      throw new Error(`error address:${cfg.address},${wallet.address}`);
    }
    return wallet.privateKey;
  }
  if (cfg.privateKey) {
    const wallet = new ethers.Wallet(cfg.privateKey);
    if (wallet.address != cfg.address) {
      throw new Error(`error address:${cfg.address},${wallet.address}`);
    }
    return wallet.privateKey;
  }
  throw new Error("error account");
}

export function toWorkflowOptions(options: ChannelOptions[][]) {
  // todo: implement
}




export function toJobs(
  options: WorkflowOptions[],
  from: string,
  to: string
): Map<string, ChannelOptions> {
  const jobs = new Map<string, ChannelOptions>();
  for (const option of options) {
    if (option.from.network != "ether" || option.to.network != "vite") {
      throw new Error(`error workflow options`);
    }
    jobs.set(option.from.channelId, option.to);
  }
  return jobs;
}
