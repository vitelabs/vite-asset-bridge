import { describe } from "mocha";
import { expect } from "chai";
import { awaitDeploy, DeployedContract } from "../src/contract";
import { accounts } from "../src/accounts";
import { compile } from "../src/compile";
import { mint } from "../src/node";

describe("call test", () => {
  // the tests container
  it("checking await call result", async () => {
    const mintResult = mint();
    const result = await compile("Channel.solpp");
    await mintResult;

    const { send, receive } = await awaitDeploy(
      accounts[0].address,
      result.abiArr[0],
      result.byteCodeArr[0],
      { params: ["tti_5649544520544f4b454e6e40"] }
    );
    console.log("------", send, receive);

    const cc = new DeployedContract(
      receive.address,
      result.abiArr[0],
      result.offChainCodeArr[0]
    );
    {
      const inputIndex = await cc.offChain("inputIndex", []);
      console.log("inputIndex", inputIndex);
      expect(inputIndex![0]).equal("0");

      const prevInputId = await cc.offChain("prevInputId", []);
      console.log("prevInputId", prevInputId);
      expect(prevInputId![0]).equal(
        "0000000000000000000000000000000000000000000000000000000000000000"
      );
    }

    await cc.awaitCall(
      accounts[0].address,
      "input",
      ["0x09FDAD54B23D937BDB6244341b24566e5F79309b", "1000000000000000000"],
      {
        tokenId: "tti_5649544520544f4b454e6e40",
        amount: "1000000000000000000",
      }
    );

    const inputIndex = await cc.offChain("inputIndex", []);
    console.log("inputIndex", inputIndex);
    expect(inputIndex![0]).equal("1");

    const prevInputId = await cc.offChain("prevInputId", []);
    console.log("prevInputId", prevInputId);
    expect(prevInputId![0]).equal(
      "182bfe56740a85d5ee35abc07143bf0d9f9525c43de7a988c6d03fa79ccba7e6"
    );

    await mint();
    // console.log(result.offChainCodeArr[0]);
    // console.log(JSON.stringify(result.abiArr[0]));

    // expect(lastToResult).to.not.be.null;
    // expect(lastToResult!.length).equal(1);
    // expect(lastToResult![0]).equal(accounts[0].address);
  }).timeout(100000);
});
