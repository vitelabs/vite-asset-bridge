import { Indexer } from "..";
import { MemoryStorage } from "../db.event";
import { EventsDB } from "../events";
import { Heights } from "../heights";

export async function txs(
  db: EventsDB,
  indexer: any,
  ctx: any,
  heights: Heights
) {
  const address = ctx.query.fromAddress;
  const net = ctx.query.fromNet;
  console.log("request", address, net);

  const txs = await getTxsFromDB(db.db("Input"), address, net);

  console.log("txs",txs);
  const results = await wrapTxsWithOutput(db.db("Output"), indexer, txs, heights);

  ctx.body = {
    code: 0,
    data: results,
  };
}

export async function tx(db: EventsDB, indexer: any, ctx: any, heights:Heights) {
  const txId = ctx.query.id;

  const txs = await getTxsFromDBById(db.db("Input"), txId);
  const results = await wrapTxsWithOutput(db.db("Output"), indexer, txs, heights);
  ctx.body = {
    code: 0,
    data: firstOne(results),
  };
}

export async function all(db: EventsDB, indexer: any, ctx: any, heights:Heights) {
  const txs = await db.db("Input").get((e: any) => {
    return true;
  });

  const results = await wrapTxsWithOutput(db.db("Output"), indexer, txs, heights);

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
      console.log(address, net, event.args.from, event.network);
      console.log(event.args.from === address && event.network === net);
      return event.args.from === address && event.network === net;
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

async function wrapTxsWithOutput(db: MemoryStorage, indexer: any, txs: any[], heights:Heights) {
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
          toHashConfirmationNums: wrapConfirmedNum(output.blockNumber, heights.getHeight(output.network)),
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
        fromHashConfirmationNums: wrapConfirmedNum(tx.blockNumber, heights.getHeight(tx.network)),
        fee: "0",
        time: tx.time,
      },
      to
    );
  });
}

function wrapConfirmedNum(confirmedHeight:number,currentHeight:number){
  if(currentHeight>confirmedHeight){
    return currentHeight - confirmedHeight;
  }else{
    return 0;
  }
}

function getTokenByContractAddress(indexer: Indexer, address: string) {
  return indexer.contractTokenMapping.get(address);
  // return { token: "USDT" };
}
