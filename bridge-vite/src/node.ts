import { provider } from "./provider";

export function mint() {
  return provider.request("miner_mine");
}

export function height() {
  return provider.request("ledger_getSnapshotChainHeight");
}
