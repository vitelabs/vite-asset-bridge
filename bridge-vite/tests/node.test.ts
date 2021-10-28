import { describe, Suite } from "mocha";
import { expect } from "chai";
import { mint, height } from "../src/node";

describe("virtual node test", () => {
  // the tests container
  it("checking mint result", async () => {
    const h1 = await height();
    await mint();
    const h2 = await height();
    expect(h2 - h1).to.equal(1);
    // result.byteCodeArr
  }).timeout(10000);
});
