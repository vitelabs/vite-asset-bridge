interface Indexing {}

export class MemoryStorage {
  db: any[];
  existed: Map<string, boolean>;

  constructor() {
    this.db = [];
    this.existed = new Map<string, boolean>();
  }
  init() {
    this.db = [];
    this.existed = new Map<string, boolean>();
  }
  async reset() {
    this.db = [];
    this.existed = new Map<string, boolean>();
  }
  async exist(event: any, keyFunc: any) {
    const key = keyFunc(event);
    return this.existed.get(key);
  }
  async put(event: any, keyFunc: any) {
    const key = keyFunc(event);
    if (this.existed.get(key)) {
      console.log(key, this.existed.get(key));
      return;
    }
    this.existed.set(key, true);
    this.db.push(event);
  }
  async putAll(events: any[], keyFunc: any) {
    for (const event of events) {
      await this.put(event, keyFunc);
    }
  }
  async get(filter: any) {
    return this.db.filter(filter);
  }

  async getSorted(filter: any, sorted: any, limit: number) {
    const result = this.db.filter(filter).sort(sorted);
    if (result.length > limit) {
      return result.slice(0, limit);
    } else {
      return result;
    }
  }
}
