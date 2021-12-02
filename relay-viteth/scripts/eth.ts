import { ethers } from "ethers";

const provider = new ethers.providers.JsonRpcProvider(
  "https://data-seed-prebsc-1-s1.binance.org:8545/"
);

async function run() {
  const tx = await provider.getTransactionReceipt(
    "0xdf1e9167a283567bc61fc400f188dd6344a37f0c92598a8fbce1cd57174ed9bf"
  );

  const address = "0x1ff7efed79585d43fb1c637064480e10c21db709";
  console.log(address);
  const contract = new ethers.Contract(address, abi, provider);

  for (const log of tx.logs) {
    if (log.address.toLocaleLowerCase() === address.toLocaleLowerCase()) {
      const ll = contract.interface.parseLog(log);
	  if(ll.name === 'Input'){
		console.log(ll.args.id, ll.args.index.toString());
	  }
    }
  }
}

run();

const abi = [
  {
    inputs: [
      {
        internalType: "contract IERC20",
        name: "_token",
        type: "address",
      },
      {
        internalType: "contract IKeeper",
        name: "_keeper",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
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
        internalType: "address",
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
        internalType: "address",
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
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "blockedOutputIds",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "dest",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "input",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "inputIndex",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "keeper",
    outputs: [
      {
        internalType: "contract IKeeper",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "id",
        type: "bytes32",
      },
      {
        internalType: "address payable",
        name: "dest",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "output",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "outputIndex",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "prevInputId",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "prevOutputId",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "id",
        type: "bytes32",
      },
    ],
    name: "spent",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];
