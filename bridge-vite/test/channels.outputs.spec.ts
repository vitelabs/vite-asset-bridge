import { expect } from "chai";
// import { beforeEach, it } from "mocha";
const vuilder = require("@vite/vuilder");
import config from "./vite.config.json";
import accounts from "./data/accounts.json";
import { ethers } from "ethers";
import assert from "assert";

let provider: any;
let deployer: any;
let vault: any;

const tokenId = "tti_5649544520544f4b454e6e40";
const addressArr = [
  "vite_cecce91eb5ed40879105e1c780c572d087bb6ec91db043f422",
  "vite_0afd645ca4b97441cae39c51e0b29355cbccbf43440457be7b",
  "vite_10930bed5611218376df608b976743fa3127b5f008e8f27f83",
];
const threshold = "3";

const keepers: any[] = [];

describe("test Vault", () => {
  before(async () => {
    provider = vuilder.newProvider(config.networks.local.http);
    console.log(await provider.request("ledger_getSnapshotChainHeight"));
    keepers.push(vuilder.newAccount(accounts.mnemonic, 0, provider));
    keepers.push(vuilder.newAccount(accounts.mnemonic, 1, provider));
    keepers.push(vuilder.newAccount(accounts.mnemonic, 2, provider));
    deployer = vuilder.newAccount(config.networks.local.mnemonic, 0, provider);
    console.log("deployer", deployer.address);

    for (let i = 0; i < addressArr.length; i++) {
      await deployer.send({ toAddress: addressArr[i] }).autoSend();
    }
    await Promise.all([
      keepers[0].receiveAll(),
      keepers[1].receiveAll(),
      keepers[2].receiveAll(),
    ]);
  });

  beforeEach(async () => {
    // compile
    const compiledContracts = await vuilder.compile("Vault.solpp");
    expect(compiledContracts).to.have.property("Vault");

    // deploy
    vault = compiledContracts.Vault;
    vault.setDeployer(deployer).setProvider(provider);
    await vault.deploy({});
    expect(vault.address).to.be.a("string");
    expect(await vault.query("numKeepers", [])).to.be.deep.equal(["0"]);
    expect(await vault.query("numChannels", [])).to.be.deep.equal(["0"]);
    await deployer.sendToken(vault.address, "100000000000000000000", tokenId);
  });




  it("test vault outputs", async () => {
    const inputHash =
      "0x391ea23ff9ad101ca92b3a1ea2cb9687731d7a8251e2ec7cfd432456503a5920";
    const outputHash =
      "0x36490d626d38eb026e860d6f06283c41469462934529b81620b551d9e7cef778";
    const keeperId = "0";
    const channelId = "0";
    await vault.call("newKeepers", [addressArr, threshold], {
      amount: "0",
    });
    await vault.call(
      "newChannelWithHash",
      [tokenId, inputHash, outputHash, keeperId],
      { amount: "0" }
    );

    const outputs = [
      {
        hash: "0x6814074811a84b38df01bf272c48c6843cdb31bdadf4814dcd2d8ff975c6b184",
        dest: "vite_cecce91eb5ed40879105e1c780c572d087bb6ec91db043f422",
        value: "240000000000000000",
      },
      {
        hash: "0xeaa983d3979646394ec1f0885ec145d824d912fdf3fc9ee973e14178c4adc9d9",
        dest: "vite_f7de29b05f4d98348098143611f44c0469e1c9d4c677cbe4a4",
        value: "250000000000000000",
      },
    ];

    for (let i = 0; i < outputs.length; i++) {
      let approved = [];
      for (let j = 0; j < keepers.length; j++) {
        approved.push(approveOutput(keepers[j], vault, keeperId, outputs[i]));
      }
      await Promise.all(approved);
      await output(vault, channelId, outputs[i]);
    }
  });
});

async function approveOutput(
  from: any,
  vault: any,
  keeperId: string,
  output: { hash: string; dest: string; value: string }
) {
  vault.setDeployer(from);

  const block = await vault.call("approveOutput", [keeperId, output.hash], {
    amount: "0",
  });

  {
    // expect Approved event
    const events = await vault.getPastEvents("Approved", {
      fromHeight: block.height,
      toHeight: block.height,
    });
    expect(events.map((event: any) => event.returnValues)).to.be.deep.equal([
      {
        "0": output.hash.replace("0x", ""),
        outputHash: output.hash.replace("0x", ""),
      },
    ]);
  }
}

async function output(
  vault: any,
  channelId: string,
  output: { hash: string; dest: string; value: string }
) {
  expect(await vault.query("numChannels", [])).to.be.deep.equal(["1"]);

  const outputId = (await vault.query("channels", [channelId]))[2];

  const block = await vault.call(
    "output",
    [channelId, output.hash, output.dest, output.value],
    {
      amount: "0",
    }
  );

  {
    // expect Approved event
    const events = await vault.getPastEvents("Output", {
      fromHeight: block.height,
      toHeight: block.height,
    });
    expect(events.map((event: any) => event.returnValues)).to.be.deep.equal([
      {
        "0": channelId,
        "1": (+outputId + 1).toString(),
        "2": output.hash.replace("0x", ""),
        "3": output.dest,
        "4": output.value,

        channelId: channelId,
        index: (+outputId + 1).toString(),
        outputHash: output.hash.replace("0x", ""),
        dest: output.dest,
        value: output.value,
      },
    ]);
  }
}

