import { ethers } from "ethers";
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
