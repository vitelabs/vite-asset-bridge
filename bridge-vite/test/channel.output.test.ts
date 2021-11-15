import { describe } from "mocha";
import { expect } from "chai";
import {
  deploy as deployContract,
  awaitDeploy,
  DeployedContract,
  awaitSend,
  awaitInitAccount,
} from "../src/contract";
import { compile } from "../src/compile";
import { mint } from "../src/node";

import { wallet } from "@vite/vitejs";
import cfg from "./vitejs.config.json";
import { newProvider } from "../src/provider";

let provider: any;
let accounts: any[];

describe("call test", () => {
  before(async function() {
    const network = cfg.networks.local;

    const viteWallet = wallet.getWallet(network.mnemonic);
    accounts = viteWallet.deriveAddressList(0, 10);
    provider = newProvider(network.url);
  });
  // the tests container
  it("checking await call result", async () => {
    const mintResult = mint(provider);
    const result = await compile("Channel.solpp");
    await mintResult;

    await awaitInitAccount(
      provider,
      accounts[0].address,
      accounts[0].privateKey,
      accounts[1].address,
      accounts[1].privateKey
    );
    await awaitInitAccount(
      provider,
      accounts[0].address,
      accounts[0].privateKey,
      accounts[2].address,
      accounts[2].privateKey
    );

    const { send, receive } = await awaitDeploy(
      provider,
      accounts[0].address,
      accounts[0].privateKey,
      result.abiArr[0],
      result.byteCodeArr[0],
      {
        params: [
          "tti_5649544520544f4b454e6e40",
          [
            "vite_cecce91eb5ed40879105e1c780c572d087bb6ec91db043f422",
            "vite_0afd645ca4b97441cae39c51e0b29355cbccbf43440457be7b",
            "vite_10930bed5611218376df608b976743fa3127b5f008e8f27f83",
          ],
          3,
        ],
      }
    );
    console.log("------", send, receive);

    const cc = new DeployedContract(
      provider,
      receive.address,
      result.abiArr[0],
      result.offChainCodeArr[0]
    );

    await awaitSend(
      provider,
      accounts[0].address,
      accounts[0].privateKey,
      cc.address,
      "tti_5649544520544f4b454e6e40",
      "2000000000000000000"
    );

    // await cc.awaitCall(accounts[0].address, "deposit", [], {
    //   tokenId: "tti_5649544520544f4b454e6e40",
    //   amount: "2000000000000000000",
    // });

    {
      const id =
        "0xd98a7f2fd0c4bd24084c9e3b9d94e24d5bde99ddd9c034b259415747076ea03b";
      await cc.awaitCall(
        accounts[0].address,
        accounts[0].privateKey,
        "approveOutput",
        [id],
        {}
      );
      await cc.awaitCall(
        accounts[1].address,
        accounts[1].privateKey,
        "approveOutput",
        [id],
        {}
      );
      await cc.awaitCall(
        accounts[2].address,
        accounts[2].privateKey,
        "approveOutput",
        [id],
        {}
      );
    }

    await cc.awaitCall(
      accounts[0].address,
      accounts[0].privateKey,
      "output",
      [
        "0xd98a7f2fd0c4bd24084c9e3b9d94e24d5bde99ddd9c034b259415747076ea03b",
        "vite_40996a2ba285ad38930e09a43ee1bd0d84f756f65318e8073a",
        "1000000000000000000",
      ],
      {}
    );

    const outputIndex = await cc.offChain("outputIndex", []);
    console.log("outputIndex", outputIndex);
    expect(outputIndex![0]).equal("1");

    const prevOutputId = await cc.offChain("prevOutputId", []);
    console.log("prevOutputId", prevOutputId);

    await mint(provider);
    // console.log(result.offChainCodeArr[0]);
    // console.log(JSON.stringify(result.abiArr[0]));

    // expect(lastToResult).to.not.be.null;
    // expect(lastToResult!.length).equal(1);
    // expect(lastToResult![0]).equal(accounts[0].address);
  }).timeout(100000);
});
