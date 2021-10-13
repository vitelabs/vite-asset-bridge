import { describe } from "mocha";
import { expect } from "chai";
import { deploy as deployContract, awaitDeploy } from "../src/contract";
import { awaitReceived, awaitConfirmed } from "../src/node";
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

    console.log(result.byteCodeArr[0]);
    const deployResult = await deployContract(
      accounts[0].address,
      result.abiArr[0],
      result.byteCodeArr[0],
      { params: ["tti_5649544520544f4b454e6e40"] }
    );
    console.log("------", deployResult);
    const receivedBlock = await awaitReceived(deployResult.hash);
    console.log("+++++++", receivedBlock);
    await mint();
    const confirmedBlock = await awaitConfirmed(receivedBlock.receiveBlockHash);
    console.log("*******", confirmedBlock);
  }).timeout(10000);

  it("checking await deploy result", async () => {
    const mintResult = mint();
    const result = await compile("Hello.solpp");
    await mintResult;

    console.log(result.byteCodeArr[0]);
    const { send, receive } = await awaitDeploy(
      accounts[0].address,
      result.abiArr[0],
      result.byteCodeArr[0],
      { params: ["tti_5649544520544f4b454e6e40"] }
    );
    console.log("------", send, receive);
  }).timeout(10000);
});
