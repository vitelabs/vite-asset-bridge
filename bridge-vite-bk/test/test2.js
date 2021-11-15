const {
	abi
} = require('@vite/vitejs');


abi_json = [{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" }], "name": "TestEvent", "type": "event" }, { "executionBehavior": "sync", "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }], "name": "test", "outputs": [], "stateMutability": "nonpayable", "type": "function" }]

log = { "topics": ["f4b438317c19db561b92fff32ab607d614813e8511408c082bd2f32d720e0fd7"], "data": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE=" }

const result = abi.decodeLog(abi_json, Buffer.from(log["data"], 'base64').toString('hex'), log["topics"], "TestEvent");

console.log(result);

console.log(Buffer.from(log["data"], 'base64').toString('hex'));