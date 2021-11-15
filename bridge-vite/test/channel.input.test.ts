import { describe } from "mocha";
import { expect } from "chai";
import {
  awaitDeploy,
  DeployedContract,
  awaitInitAccount,
} from "../src/contract";
import { compile } from "../src/compile";
import { mint, sleep } from "../src/node";
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
    await mint(provider);
    await mint(provider);
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
    console.log("------", send, receive, receive.address);

    const cc = new DeployedContract(
      provider,
      receive.address,
      result.abiArr[0],
      result.offChainCodeArr[0]
    );

    await assertInputEquals(
      cc,
      "0",
      "0000000000000000000000000000000000000000000000000000000000000000"
    );

    await cc.awaitCall(
      accounts[0].address,
      accounts[0].privateKey,
      "input",
      ["0x09FDAD54B23D937BDB6244341b24566e5F79309b", "1000000000000000000"],
      {
        tokenId: "tti_5649544520544f4b454e6e40",
        amount: "1000000000000000000",
      }
    );

    await assertInputEquals(
      cc,
      "1",
      "182bfe56740a85d5ee35abc07143bf0d9f9525c43de7a988c6d03fa79ccba7e6"
    );

    const id =
      "0x182bfe56740a85d5ee35abc07143bf0d9f9525c43de7a988c6d03fa79ccba7e6";

    await cc.awaitCall(
      accounts[0].address,
      accounts[0].privateKey,
      "proveInputId",
      [
        27,
        "0x10921963a8f8d23d74086b47b159f1fe27914148916d75624e7a1e8d3f4d4aba",
        "0x7f0dd8028fd3bc3ae3e15156cdb04e3317b39a7036e4d518defe020dcd3d4c30",
        id,
      ],
      {}
    );
    await cc.awaitCall(
      accounts[1].address,
      accounts[1].privateKey,
      "proveInputId",
      [
        27,
        "0xc867f8ab48d20d664a5f69346c6d0fd73eb007016a18ef80539e1ac19be44550",
        "0x19dc481caeddf2af4479ad54bfe272470ba21117b2ce02f9cba9043d8c45c7ec",
        id,
      ],
      {}
    );
    await cc.awaitCall(
      accounts[2].address,
      accounts[2].privateKey,
      "proveInputId",
      [
        27,
        "0xbb351f023ffda4c90ddfdba9c9797cb0b23b59ab13e514ad2d64423101037da0",
        "0x7db3ee064793c65f0cbcb33b684e3a743694897ea11757b8567ebb9931938db4",
        id,
      ],
      {}
    );

    await mint(provider);
  }).timeout(100000);
});

async function assertInputEquals(
  cc: DeployedContract,
  index: string,
  id: string
) {
  const inputIndex = await cc.offChain("inputIndex", []);
  console.log("inputIndex", inputIndex);
  expect(inputIndex![0]).equal(index);

  const prevInputId = await cc.offChain("prevInputId", []);
  console.log("prevInputId", prevInputId);
  expect(prevInputId![0]).equal(id);
}
