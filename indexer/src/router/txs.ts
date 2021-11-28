import { Indexer } from "..";
import { MemoryStorage } from "../db.event";
import { EventsDB } from "../events";

export async function txs(db: EventsDB, indexer: any, ctx: any) {
  const address = ctx.query.fromAddress;
  const net = ctx.query.fromNet;

  const txs = await getTxsFromDB(db.db("Input"), address, net);

  const results = await wrapTxsWithOutput(db.db("Output"), indexer, txs);

  ctx.body = {
    code: 0,
    data: results,
  };
}

export async function tx(db: EventsDB, indexer: any, ctx: any) {
  const txId = ctx.query.id;

  const txs = await getTxsFromDBById(db.db("Input"), txId);
  const results = await wrapTxsWithOutput(db.db("Output"), indexer, txs);
  ctx.body = {
    code: 0,
    data: firstOne(results),
  };
}

export async function all(db: EventsDB, indexer: any, ctx: any) {
  const txs = await db.db("Input").get((e: any) => {
    return true;
  });

  const results = await wrapTxsWithOutput(db.db("Output"), indexer, txs);

  ctx.body = {
    code: 0,
    data: results,
  };
}

function firstOne(results: any[]) {
  if (results.length > 0) {
    return results[0];
  }
  return null;
}

async function getTxsFromDB(db: MemoryStorage, address: string, net: string) {
  const results = await db.getSorted(
    (event: any) => {
      return event.args.from === address && event.args.network === net;
    },
    (a: any, b: any) => {
      if (a.blockNumber != b.blockNumber) {
        return a.blockNumber < b.blockNumber;
      }
      return a.transactionIndex < b.transactionIndex;
    },
    100
  );

  return results;
}

async function getTxsFromDBById(db: MemoryStorage, id: string) {
  const results = await db.getSorted(
    (event: any) => {
      return event.args.id === id;
    },
    (a: any, b: any) => {
      if (a.blockNumber != b.blockNumber) {
        return a.blockNumber < b.blockNumber;
      }
      return a.transactionIndex < b.transactionIndex;
    },
    100
  );

  return results;
}

async function wrapTxsWithOutput(db: MemoryStorage, indexer: any, txs: any[]) {
  const ids = new Set(
    txs.map((m) => {
      return m.args.id;
    })
  );
  const outputs = await db.get((m: any) => {
    return ids.has(m.args.id);
  });
  // id->output
  const outputsMap: Map<string, any> = new Map();
  for (const output of outputs) {
    outputsMap.set(output.args.id, output);
  }

  return txs.map((tx) => {
    let result: { [k: string]: string } = {};
    const tokenInfo: any = getTokenByContractAddress(indexer, tx.address);
    result.id = tx.args.id;

    const output = outputsMap.get(tx.args.id);
    const to = output
      ? {
          toNet: output.network,
          toHash: output.transactionHash,
          toHashConfirmedHeight: output.blockNumber,
        }
      : {};

    return Object.assign(
      {
        id: tx.args.id,
        idx: tx.args.index,
        amount: tx.args.value,
        fromAddress: tx.args.from,
        toAddress: tx.args.dest,
        token: tokenInfo.token,
        fromNet: tx.network,
        fromHash: tx.transactionHash,
        fromHashConfirmedHeight: tx.blockNumber,
        fee: "0",
        time: tx.time,
      },
      to
    );
  });
}

function getTokenByContractAddress(indexer:Indexer, address: string) {
  return indexer.contractTokenMapping.get(address)
  // return { token: "USDT" };
}
