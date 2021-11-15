import Provider from "@vite/vitejs/distSrc/viteAPI/provider";

export async function mint(provider: any) {
  await sleep(1000);
  return provider.request("miner_mine");
}

export function height(provider: any) {
  return provider.request("ledger_getSnapshotChainHeight");
}
export function accountHeight(provider: any, to: string) {
  return provider
    .request("ledger_getLatestAccountBlock", to)
    .then((block: any) => {
      if (block) {
        return block.height;
      } else {
        return 0;
      }
    });
}

export function accountUnReceived(provider: any, account: string) {
  return provider.request(
    "ledger_getUnreceivedBlocksByAddress",
    account,
    0,
    100
  );
}

export async function accountBlock(provider: any, hash: string) {
  return provider.request("ledger_getAccountBlockByHash", hash);
}

export async function isReceived(provider: any, hash: string) {
  return accountBlock(provider, hash).then((block) => {
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

export function isConfirmed(provider: any, hash: string) {
  return accountBlock(provider, hash).then((block) => {
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

export async function awaitReceived(provider: any, hash: string) {
  while (!(await isReceived(provider, hash))) {
    await sleep(1000);
  }
  return await accountBlock(provider, hash);
}

export async function awaitConfirmed(provider: any, hash: string) {
  while (!(await isConfirmed(provider, hash))) {
    await sleep(1000);
  }
  return await accountBlock(provider, hash);
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
