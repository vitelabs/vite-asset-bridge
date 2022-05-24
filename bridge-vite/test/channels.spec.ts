import { expect } from "chai";
// import { beforeEach, it } from "mocha";
import * as vuilder from "@vite/vuilder";
import config from "./vite.config.json";
import accounts from "./data/accounts.json";
import { ethers } from "ethers";
import assert from "assert";

let provider: any;
let deployer: vuilder.UserAccount;
let vault: any;

const tokenId = "tti_5649544520544f4b454e6e40";
const addressArr = [
  "vite_cecce91eb5ed40879105e1c780c572d087bb6ec91db043f422",
  "vite_0afd645ca4b97441cae39c51e0b29355cbccbf43440457be7b",
  "vite_10930bed5611218376df608b976743fa3127b5f008e8f27f83",
];
const threshold = "3";
const decimalDiff = -2;
const minValue = "100000000000000000";
const maxValue = "10000000000000000000";

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
      await deployer.send({ toAddress: addressArr[i], tokenId: "tti_5649544520544f4b454e6e40", amount: "0", data: "" }).autoSend();
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

  it("test vault new channel", async () => {
    const block = await vault.call(
      "newChannel",
      [tokenId, addressArr, threshold, decimalDiff, minValue, maxValue],
      { amount: "0" }
    );
    expect(await vault.query("numChannels", [])).to.be.deep.equal(["1"]);
    expect(await vault.query("infoKeepers", [0])).to.be.deep.equal([
      threshold,
      addressArr,
    ]);
    expect(await vault.query("channels", [0])).to.be.deep.equal([
      "0",
      "97fbd18313234e2f9c2d3fdc02aea5dcc6aeb564ab1cdaaf57777044667ecc03",
      "0",
      "150923ed3284416e935f71be0af1f5bbd6517eefedff4931ebf7755c7660c14c",
      decimalDiff.toString(),
      minValue,
      maxValue,
      "tti_5649544520544f4b454e6e40",
      "0",
    ]);
    {
      // expect KeepersAddition event
      const events = await vault.getPastEvents("KeepersAddition", {
        fromHeight: block.height,
        toHeight: block.height,
      });
      expect(events.map((event: any) => event.returnValues)).to.be.deep.equal([
        {
          "0": "0",
          id: "0",
        },
      ]);
    }
    {
      // expect LogChannelsAddition event
      const events = await vault.getPastEvents("LogChannelsAddition", {
        fromHeight: block.height,
        toHeight: block.height,
      });
      expect(events.map((event: any) => event.returnValues)).to.be.deep.equal([
        {
          "0": "0",
          "1": tokenId,
          id: "0",
          token: tokenId,
        },
      ]);
    }
  });

  it("test vault new keepers", async () => {
    const block = await vault.call("newKeepers", [addressArr, threshold], {
      amount: "0",
    });
    expect(await vault.query("infoKeepers", [0])).to.be.deep.equal([
      threshold,
      addressArr,
    ]);

    {
      // expect KeepersAddition event
      const events = await vault.getPastEvents("KeepersAddition", {
        fromHeight: block.height,
        toHeight: block.height,
      });
      expect(events.map((event: any) => event.returnValues)).to.be.deep.equal([
        {
          "0": "0",
          id: "0",
        },
      ]);
    }
  });

  it("test vault [newChannelWithHash]", async () => {
    const inputHash =
      "0x291ea23ff9ad101ca92b3a1ea2cb9687731d7a8251e2ec7cfd432456503a5920";
    const outputHash =
      "0x391ea23ff9ad101ca92b3a1ea2cb9687731d7a8251e2ec7cfd432456503a5920";
    const keeperId = "0";
    const channelId = "0";

    await vault.call("newKeepers", [addressArr, threshold], {
      amount: "0",
    });

    const block = await vault.call(
      "newChannelWithHash",
      [tokenId, inputHash, outputHash, keeperId, decimalDiff, minValue, maxValue],
      { amount: "0" }
    );
    expect(await vault.query("numChannels", [])).to.be.deep.equal(["1"]);
    expect(await vault.query("channels", [channelId])).to.be.deep.equal([
      "0",
      inputHash.replace("0x", ""),
      "0",
      outputHash.replace("0x", ""),
      decimalDiff.toString(),
      minValue,
      maxValue,
      tokenId,
      keeperId,
    ]);
    {
      // expect LogChannelsAddition event
      const events = await vault.getPastEvents("LogChannelsAddition", {
        fromHeight: block.height,
        toHeight: block.height,
      });
      expect(events.map((event: any) => event.returnValues)).to.be.deep.equal([
        {
          "0": "0",
          "1": tokenId,
          id: "0",
          token: tokenId,
        },
      ]);
    }
  });

  it("test vault outputs", async () => {
    const inputHash =
      "0x391ea23ff9ad101ca92b3a1ea2cb9687731d7a8251e2ec7cfd432456503a5920";
    const outputHash =
      "0xbdecf81ef1b90044720406696860ab03fd0dfdd3b867c83ad52a2d791cc0f008";
    const keeperId = "0";
    const channelId = "0";
    await vault.call("newKeepers", [addressArr, threshold], {
      amount: "0",
    });
    await vault.call(
      "newChannelWithHash",
      [tokenId, inputHash, outputHash, keeperId, decimalDiff, minValue, maxValue],
      { amount: "0" }
    );

    const outputs = [
      {
        hash: "0x3ebfdb413885a703ac9dca2dab593e16a210af4729ad4970bf7e32edc0efa29f",
        dest: "vite_cecce91eb5ed40879105e1c780c572d087bb6ec91db043f422",
        value: "240000000000000000",
      },
      {
        hash: "0x140b45a310a52dd9a782b46141cc19863581979f57316fce4a84a5b023c883d3",
        dest: "vite_cecce91eb5ed40879105e1c780c572d087bb6ec91db043f422",
        value: "250000000000000000",
      },
    ];

    for (let i = 0; i < outputs.length; i++) {
      let approved = [];
      for (let j = 0; j < keepers.length; j++) {
        approved.push(approveOutput(keepers[j], vault, keeperId, outputs[i]));
      }
      await Promise.all(approved);
      await output(vault, channelId, outputs[i], decimalDiff);
    }
  });

  it("test vault inputs", async () => {
    const inputHash =
      "0x391ea23ff9ad101ca92b3a1ea2cb9687731d7a8251e2ec7cfd432456503a5920";
    const outputHash =
      "0xbdecf81ef1b90044720406696860ab03fd0dfdd3b867c83ad52a2d791cc0f008";
    const keeperId = "0";
    const channelId = "0";
    await vault.call("newKeepers", [addressArr, threshold], {
      amount: "0",
    });
    await vault.call(
      "newChannelWithHash",
      [tokenId, inputHash, outputHash, keeperId, decimalDiff, minValue, maxValue],
      { amount: "0" }
    );

    const inputs = [
      {
        dest: "0x09FDAD54B23D937BDB6244341b24566e5F79309b",
        value: "0.29",
      },
      {
        dest: "0x09FDAD54B23D937BDB6244341b24566e5F79309b",
        value: "0.22",
      },
    ];

    inputs.forEach((input) => {
      input.dest = ethers.utils.hexlify(input.dest);
      input.value = ethers.utils.parseEther(input.value).toString();
    });

    // const channel = await vault.channels(channelId);
    // const prevInputHash = channel.inputHash;
    // const prevInputId = channel.inputId;
    // console.log(JSON.stringify([+prevInputId, prevInputHash]));

    for (let i = 0; i < inputs.length; i++) {
      await input(deployer.address, vault, channelId, inputs[i]);
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
  output: { hash: string; dest: string; value: string },
  decimalDiff: any
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

  let scaledValue = decimalDiff < 0 ? parseInt(output.value) / (Math.pow(10, -decimalDiff)) : parseInt(output.value) * (Math.pow(10, decimalDiff));

  {
    // expect Approved event
    const events = await vault.getPastEvents("Output", {
      fromHeight: block.height,
      toHeight: block.height,
    });
    expect(events.map((event: any) => event.returnValues)).to.be.deep.equal([
      {
        "0": "0",
        "1": (+outputId + 1).toString(),
        "2": output.hash.replace("0x", ""),
        "3": output.dest,
        "4": scaledValue.toString(),

        channelId: "0",
        index: (+outputId + 1).toString(),
        outputHash: output.hash.replace("0x", ""),
        dest: output.dest,
        value: scaledValue.toString(),
      },
    ]);
  }
}

async function input(
  fromAddress: string,
  vault: any,
  channelId: string,
  input: { dest: string; value: string }
) {
  // console.log(input.dest, input.value);
  const channel = await vault.query("channels", [channelId]);
  const prevInputHash = channel[1];
  const prevInputId = channel[0];

  const inputHash = ethers.utils.solidityKeccak256(
    ["uint256", "bytes", "uint256", "bytes32"],
    [prevInputId, input.dest, input.value, "0x" + prevInputHash]
  );
  // console.log(JSON.stringify((await provider.getBalanceInfo(vault.address)).balance.balanceInfoMap[tokenId]));

  const beforeBalance = BigInt((await provider.getBalanceInfo(vault.address)).balance.balanceInfoMap[tokenId].balance);

  const block = await vault.call(
    "input",
    [channelId, input.dest, input.value],
    {
      amount: input.value,
    }
  );
  {
    // expect Input event
    const events = await vault.getPastEvents("Input", {
      fromHeight: block.height,
      toHeight: block.height,
    });
    expect(events.map((event: any) => event.returnValues)).to.be.deep.equal([
      {
        "0": channelId,
        "1": (+prevInputId + 1).toString(),
        "2": inputHash.replace("0x", ""),
        "3": input.dest.replace("0x", ""),
        "4": input.value,
        "5": fromAddress,
        channelId: channelId,
        index: (+prevInputId + 1).toString(),
        inputHash: inputHash.replace("0x", ""),
        dest: input.dest.replace("0x", ""),
        value: input.value,
        from: fromAddress,
      },
    ]);
  }

  console.log(
    JSON.stringify([+prevInputId + 1, inputHash, input.dest, input.value])
  );

  const afterBalance = BigInt((await provider.getBalanceInfo(vault.address)).balance.balanceInfoMap[tokenId].balance);
  // console.log(beforeBalance, afterBalance);

  assert.equal((afterBalance - beforeBalance).toString(), input.value.toString());
}
