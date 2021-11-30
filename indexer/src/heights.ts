import { sleep } from "./utils/utils";

export class Heights {
  heights: Map<string, number> = new Map();
  funs: Map<string, any> = new Map();

  add(net: string, fn: any) {
    this.funs.set(net, fn);
  }

  getHeight(net: string): number {
    const result = this.heights.get(net);
    if (result) {
      return result;
    } else {
      return 0;
    }
  }

  async loop() {
    while (true) {
      for (const fn of this.funs) {
        try {
          const height = await fn[1]();
          this.heights.set(fn[0], height);
        } catch (err) {
          console.error(err);
        }
      }
      await sleep(10000);
    }
  }
}
