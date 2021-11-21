import { MemoryStorage } from "../db.event";
import { EventsDB } from "../events";

const TXS_DB_ID_MAPPING = {
  ETH: {
    dbId: "eth_inputs",
    queryFn: getTxsFromEthDB,
  },
  VITE: {
    dbId: "vite_inputs",
    queryFn: getTxsFromViteDB,
  },
};

const TX_DB_ID_MAPPING = {
  ETH: {
    dbId: "eth_inputs",
    queryFn: getTxFromEthDB,
  },
  VITE: {
    dbId: "vite_inputs",
    queryFn: getTxFromViteDB,
  },
};

export async function txs(db: EventsDB, ctx: any) {
  const addrInfo = ctx.query.addrInfo;
  const addrArr = JSON.parse(addrInfo);

  const results: any[] = [];

  for (const addr of addrArr) {
    const queryDB =
      TXS_DB_ID_MAPPING[addr.net as keyof typeof TXS_DB_ID_MAPPING];
    results.push(...(await queryDB.queryFn(db.db(queryDB.dbId), addr.address)));
  }

  ctx.body = {
    code: 0,
    data: results,
  };
}

export async function tx(db: EventsDB, ctx: any) {
  const txId = ctx.query.id;
  const net = ctx.query.net;

  const queryDB = TX_DB_ID_MAPPING[net as keyof typeof TX_DB_ID_MAPPING];
  const result = await queryDB.queryFn(db.db(queryDB.dbId), txId);
  ctx.body = {
    code: 0,
    data: result,
  };
}

// function txs(db: EventsDB, ctx: any) {}

function firstOne(results: any[]) {
  if (results.length > 0) {
    return results[0];
  }
  return null;
}

async function getTxsFromEthDB(db: MemoryStorage, address: string) {
  const results = await db.getSorted(
    (event: any) => {
      return event.args.from === address;
    },
    (a: any, b: any) => {
      return a.blockNumber < b.blockNumber;
    },
    1000
  );

  return results.map(ethEventToTx);
}

async function getTxsFromViteDB(db: MemoryStorage, address: string) {
  const results = await db.getSorted(
    (event: any) => {
      return event.event.from === address;
    },
    (a: any, b: any) => {
      return a.height < b.height;
    },
    100
  );

  return results.map(viteEventToTx);
}

async function getTxFromEthDB(db: MemoryStorage, id: string) {
  const results = await db.get((event: any) => {
    if (event.args.id === id) {
      return true;
    }
  });

  return firstOne(results.map(ethEventToTx));
}

async function getTxFromViteDB(db: MemoryStorage, id: string) {
  const results = await db.get((event: any) => {
    if (event.event.id === id) {
      return true;
    }
  });

  return firstOne(results.map(ethEventToTx));
}

function viteEventToTx(event: any) {
  return {
    id: event.event.id,
    idx: event.event.index.toString(),
    amount: event.event.value,
    hash: event.hash,
    blockHeight: event.blockHeight,
  };
}

function ethEventToTx(event: any) {
  return {
    id: event.args.id,
    idx: event.args.index.toString(),
    amount: event.args.value.toString(),
    hash: event.transactionHash,
    blockHeight: event.blockNumber,
  };
}

// id: string,
// idx: number,
// amount: string,
// toAddress: string,
// fromHash: string,
// fromHashConfirmationNums: number,
// toHash: string,
// toHashCOnfirmationNums: number
