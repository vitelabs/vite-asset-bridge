import { describe } from "mocha";
import { writeJson } from "../src/utils/utils";
import { StoredLogIndex } from "../src/channel/channelEther";

describe("channel vite test", () => {
  // the tests container
  it("checking channel vite contract", async () => {
    let xxx = {
      height: 0,
      logIndex: -1,
      txIndex: -1,
      inputsIndex: {},
    } as {
      inputsIndex: { [k: string]: number };
    };

    xxx.inputsIndex["HELLO"] = 10;

    console.log(JSON.stringify(xxx));

    let result = JSON.parse(JSON.stringify(xxx)) as {
      inputsIndex: { [k: string]: number };
    };
    result.inputsIndex["dddd"] = 20;

    console.log(result);
  });
});
