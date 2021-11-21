import { describe } from "mocha";
import { expect, assert } from "chai";
import { Scanner, newScanner } from "../src/blockchain";
import { MemoryStorage } from "../src/db.event";

let scanner: Scanner;

describe("scanner eth test", () => {
  beforeEach(async function() {
    const cfg = {
      networkType: "vite",
      network: "vite_buidl",
      address: "vite_75043ce60463a3c14b188a1505fd359acaef278c16dece5a0b",
      endpoint: {
        url: "https://buidl.vite.net/gvite",
      },
      eventName: "Input",
      abi: [
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "index",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "bytes32",
              name: "id",
              type: "bytes32",
            },
            {
              indexed: false,
              internalType: "bytes",
              name: "dest",
              type: "bytes",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "value",
              type: "uint256",
            },
          ],
          name: "Input",
          type: "event",
        },
      ],
    };
    scanner = newScanner(new MemoryStorage(), cfg);
  });

  // the tests container
  it("scan contract events", async () => {
    await scanner.pullFromTo(0, 100);

    const all = await scanner.getStorage().get((event: any) => {
      return true;
    });
    console.log(all);
  }).timeout(10000);
});
