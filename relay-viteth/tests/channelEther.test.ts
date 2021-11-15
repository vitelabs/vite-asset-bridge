import { describe } from "mocha";
import { expect, assert } from "chai";
import { ChannelEther } from "../src/channel/channelEther";

let ceth: ChannelEther;
describe("channel vite test", () => {
  beforeEach(async function() {
    const cfg = {
      address: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
      endpoint: {
        type: "dev",
        url: "http://localhost:8545",
      },
      mnemonic:
        "turtle siren orchard alpha indoor indicate wasp such waste hurt patient correct true firm goose elegant thunder torch hurt shield taste under basket burger",
    };
    ceth = new ChannelEther(cfg);
  });
  // the tests container
  it("checking channel vite contract", async () => {
    console.log(await ceth.inputIndex());
    console.log(await ceth.prevInputId());
    console.log(await ceth.outputIndex());
    console.log(await ceth.prevOutputId());

    const inputs = await ceth.scanConfirmedInputs("5");

    console.log(inputs);
  });

  it("check update confirmed info", async () => {
    {
      ceth.updateConfirmedInfo({
        height: "0",
        index: "0",
        txIndex: 0,
        logIndex: 0,
      });

      const info = ceth.getConfirmedInfo();
      assert.equal(info.height, "0");
      assert.equal(info.index, "0");
    }

    {
      ceth.updateConfirmedInfo({
        height: "1",
        index: "1",
        txIndex: 1,
        logIndex: 1,
      });

      const info = ceth.getConfirmedInfo();
      assert.equal(info.height, "1");
      assert.equal(info.index, "1");
    }
  });
});
