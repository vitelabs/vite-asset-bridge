import { describe } from "mocha";
import { expect, assert } from "chai";
import { ChannelVite } from "../src/channel/channelVite";

let cvite: ChannelVite;
describe("channel vite test", () => {
  beforeEach(async function() {
    const cfg = {
      address: "vite_b3f54cac6ed30fb203a006c02834aee065dcca95f2a9ab7477",
      url: "http://127.0.0.1:48132/",
      mnemonic:
        "turtle siren orchard alpha indoor indicate wasp such waste hurt patient correct true firm goose elegant thunder torch hurt shield taste under basket burger",
    };
    cvite = new ChannelVite(cfg);
  });
  // the tests container
  it("checking channel vite contract", async () => {
    console.log(await cvite.inputIndex());
    console.log(await cvite.prevInputId());
    console.log(await cvite.outputIndex());
    console.log(await cvite.prevOutputId());

    const [newHeight, input] = await cvite.scanConfirmedInput("0");

    cvite.approveOutput
    console.log(newHeight);
    console.log(input);
  });

  it("check update confirmed info", async () => {
    {
      cvite.updateConfirmedInfo({
        scannedHeight: "0",
        index: "0",
      });

      const info = cvite.getConfirmedInfo();
      assert.equal(info.scannedHeight, "0");
      assert.equal(info.index, "0");
    }

    {
      cvite.updateConfirmedInfo({
        scannedHeight: "1",
        index: "1",
      });
      const info = cvite.getConfirmedInfo();
      assert.equal(info.scannedHeight, "1");
      assert.equal(info.index, "1");
    }
  });
});
