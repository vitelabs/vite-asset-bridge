// test/keeper_multisig_test.js
// Load dependencies
const { use, expect, assert } = require("chai");
const { ethers } = require("hardhat");
const keccak256 = require("keccak256");

// const abi = require('ethereumjs-abi');

// Start test block
describe("MultiSigKeeper", function () {
  it("Should Input", async function () {
    const msg =
      "0x182bfe56740a85d5ee35abc07143bf0d9f9525c43de7a988c6d03fa79ccba7e6";
    const v = 27;
    const r =
      "0xbb351f023ffda4c90ddfdba9c9797cb0b23b59ab13e514ad2d64423101037da0";
    const s =
      "0x7db3ee064793c65f0cbcb33b684e3a743694897ea11757b8567ebb9931938db4";
    const expandedSig = {
      r: r,
      s: s,
      v: v,
    };
    const signature = ethers.utils.joinSignature(expandedSig);
    const recoveredAddress = ethers.utils.recoverAddress(msg, signature);
    console.log(recoveredAddress);

    const keys = [
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
      "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    ];

    keys.forEach((key) => {
      const signingKey = new ethers.utils.SigningKey(key);
      const signature = signingKey.signDigest(msg);
      signature.address = ethers.utils.computeAddress(
        ethers.utils.recoverPublicKey(msg, signature)
      );
      console.log(signature.address);
    });
  });
});
