import { describe } from "mocha";
import { expect } from "chai";
import { deployContract } from "../src/deploy";
import { accounts } from "../src/accounts";
import { compile } from "../src/compile";
import { mint } from "../src/node";
import { compiler } from "../src/config";

describe("deploy test", () => {
  // the tests container
  it("checking deploy result", async () => {
    const mintResult = mint();
    const result = await compile("Hello.solpp");
    await mintResult;

    await deployContract(
      accounts[0].address,
      result.abiArr[0],
      result.byteCodeArr[0],
      { params: ["tti_5649544520544f4b454e6e40"] }
    );
    console.log(result);
    // deployContract;
    // // result.byteCodeArr
    // expect(result.byteCodeArr[0]).to.equal(bytecode);
  });
});
