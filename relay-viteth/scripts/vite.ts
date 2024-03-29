import { ViteAPI, abi } from "@vite/vitejs";
const { HTTP_RPC } = require("@vite/vitejs-http");

const url = "https://buidl.vite.net/gvite";
const viteProvider = new ViteAPI(new HTTP_RPC(url), () => {
  console.log("vite provider connected");
});

async function run() {
  const sendBlockHash =
    "721433b075990286ee85d26af28b851caaec6dc13ace1c80f3fc4513ca63718a";
  const sendBlock = await viteProvider.request(
    "ledger_getAccountBlockByHash",
    sendBlockHash
  );
  const receiveBlockHash = sendBlock.receiveBlockHash;

  const logs = await viteProvider.request("ledger_getVmLogs", receiveBlockHash);

  for (const log of logs) {
    const abiItem = channelAbi.find(
      (item) => abi.encodeLogSignature(item) === log.topics[0]
    );
    if (abiItem && abiItem.name === "Input") {
      // console.log(abiItem);
      const result = abi.decodeLog(
        channelAbi,
        Buffer.from(log.data ? log.data : "", "base64").toString("hex"),
        log.topics.slice(1, log.topics.length),
        abiItem?.name
      );

      console.log(result['id' as keyof typeof result]);
      console.log(result['index' as keyof typeof result]);
    }
  }
}

run();

const channelAbi = [
  {
    inputs: [
      { internalType: "tokenId", name: "_tid", type: "tokenId" },
      {
        internalType: "address payable[]",
        name: "_keepers",
        type: "address[]",
      },
      { internalType: "uint8", name: "_threshold", type: "uint8" },
    ],
    stateMutability: "payable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "id",
        type: "bytes32",
      },
    ],
    name: "Approved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "id",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "dest",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address payable",
        name: "from",
        type: "address",
      },
    ],
    name: "Input",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "id",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "sigR",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "sigS",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "sigV",
        type: "uint8",
      },
    ],
    name: "InputProved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "id",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "address payable",
        name: "dest",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Output",
    type: "event",
  },
  {
    executionBehavior: "async",
    inputs: [
      { internalType: "bytes32", name: "id", type: "bytes32" },
      { internalType: "address payable", name: "dest", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "approveAndExecOutput",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    executionBehavior: "async",
    inputs: [{ internalType: "bytes32", name: "id", type: "bytes32" }],
    name: "approveOutput",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    executionBehavior: "async",
    inputs: [
      { internalType: "bytes", name: "dest", type: "bytes" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "input",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    executionBehavior: "async",
    inputs: [
      { internalType: "bytes32", name: "id", type: "bytes32" },
      { internalType: "address payable", name: "dest", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "output",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    executionBehavior: "async",
    inputs: [
      { internalType: "uint8", name: "sigV", type: "uint8" },
      { internalType: "bytes32", name: "sigR", type: "bytes32" },
      { internalType: "bytes32", name: "sigS", type: "bytes32" },
      { internalType: "bytes32", name: "id", type: "bytes32" },
    ],
    name: "proveInputId",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    executionBehavior: "sync",
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "approvedCnt",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "offchain",
  },
  {
    executionBehavior: "sync",
    inputs: [
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "address payable", name: "", type: "address" },
    ],
    name: "approvedKeepers",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "offchain",
  },
  {
    executionBehavior: "sync",
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "blockedOutputIds",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "offchain",
  },
  {
    executionBehavior: "sync",
    inputs: [],
    name: "inputIndex",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "offchain",
  },
  {
    executionBehavior: "sync",
    inputs: [
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "address payable", name: "", type: "address" },
    ],
    name: "inputProvedKeepers",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "offchain",
  },
  {
    executionBehavior: "sync",
    inputs: [{ internalType: "address payable", name: "", type: "address" }],
    name: "keepers",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "offchain",
  },
  {
    executionBehavior: "sync",
    inputs: [],
    name: "outputIndex",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "offchain",
  },
  {
    executionBehavior: "sync",
    inputs: [],
    name: "prevInputId",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "offchain",
  },
  {
    executionBehavior: "sync",
    inputs: [],
    name: "prevOutputId",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "offchain",
  },
  {
    executionBehavior: "sync",
    inputs: [],
    name: "threshold",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "offchain",
  },
  {
    executionBehavior: "sync",
    inputs: [],
    name: "tid",
    outputs: [{ internalType: "tokenId", name: "", type: "tokenId" }],
    stateMutability: "view",
    type: "offchain",
  },
];
