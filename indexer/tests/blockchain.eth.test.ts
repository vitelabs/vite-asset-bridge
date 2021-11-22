import { describe } from "mocha";
import { expect, assert } from "chai";
import { ScannerEth } from "../src/blockchain.eth";
import { MemoryStorage } from "../src/db.event";

let scanner: ScannerEth;

describe("scanner eth test", () => {
  beforeEach(async function() {
    const cfg = {
      network: "bsctest",
      address: "0x2FE56DB3F21815Ab26828debC175aB08D91CF81D",
      endpoint: {
        type: "rpc",
        url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      },
      eventName: "Input",
      fromBlockHeight: 14159540,
      abi: [
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
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

    scanner = new ScannerEth(new MemoryStorage(), cfg);
  });

  // the tests container
  it("scan contract events", async () => {
    await scanner.pullFromTo(14159540, 14164540);
    // await scanner.pull();
    const all = await scanner.storage.get((event: any) => {
      return true;
    });
    console.log(all[0]);
    // console.log(all);
  }).timeout(10000);
});
