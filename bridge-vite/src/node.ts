import { provider } from "./provider";

export function mint() {
  return provider.request("miner_mine");
}

export function height() {
  return provider.request("ledger_getSnapshotChainHeight");
}
export function accountHeight(to: string) {
  return provider.request("ledger_getLatestAccountBlock", to).then((block) => {
    if (block) {
      return block.height;
    } else {
      return 0;
    }
  });
}

export function accountUnReceived(account: string) {
  return provider.request(
    "ledger_getUnreceivedBlocksByAddress",
    account,
    0,
    100
  );
}

export async function accountBlock(hash: string) {
  return provider.request("ledger_getAccountBlockByHash", hash);
}

export function isReceived(hash: string) {
  return accountBlock(hash).then((block) => {
    if (!block) {
      return false;
    } else {
      if (!block.receiveBlockHash) {
        return false;
      } else {
        return true;
      }
    }
  });
}

export function isConfirmed(hash: string) {
  return accountBlock(hash).then((block) => {
    if (!block) {
      return false;
    } else {
      if (!block.confirmedHash) {
        return false;
      } else {
        return true;
      }
    }
  });
}

export async function awaitReceived(hash: string) {
  while (!(await isReceived(hash))) {
    await sleep(1000);
  }
  return await accountBlock(hash);
}

export async function awaitConfirmed(hash: string) {
  while (!(await isConfirmed(hash))) {
    await sleep(1000);
  }
  return await accountBlock(hash);
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
