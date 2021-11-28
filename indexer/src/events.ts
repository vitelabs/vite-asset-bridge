import { Scanner, newScanner } from "./blockchain";
import { MemoryStorage } from "./db.event";

export async function scanWith(eventsDB: EventsDB, cfg: any) {
  const events = cfg.events;
  const networks = cfg.networks;

  let scanners: Scanner[] = [];
  for (let event of events) {
    console.log(event);
    event.endpoint = networks[event.network as keyof typeof networks];
    const scanner = newScanner(eventsDB.db(event.storage), event);
    await scanner.init();
    await scanner.start();
    scanners.push(scanner);
  }
  while (true) {
    try{
      await loop(scanners);
    }catch (err) {
      console.error(err);
    }
    await sleep(10000);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function loop(scanners: Scanner[]) {
  let results: any[] = [];
  for (const scanner of scanners) {
    results.push(scanner.pull());
  }
  await Promise.all(results);
}

export class EventsDB {
  eventDB: Map<string, MemoryStorage>;

  constructor() {
    this.eventDB = new Map<string, MemoryStorage>();
  }

  db(key: string) {
    const db = this.eventDB.get(key);
    if (db) {
      return db;
    } else {
      const newDB = new MemoryStorage();
      this.eventDB.set(key, newDB);
      return newDB;
    }
  }
}
