const {
	abi
} = require('@vite/vitejs');

import HTTP_RPC from "@vite/vitejs-http";

const { ViteAPI, wallet, utils, abi, accountBlock, keystore } = require('@vite/vitejs');

// test account
const seed = "turtle siren orchard alpha indoor indicate wasp such waste hurt patient correct true firm goose elegant thunder torch hurt shield taste under basket burger";

// connect to node
const provider = new ViteAPI(new HTTP_RPC("http://localhost:8080"), () => {
	console.log("client connected");
});

// derive account from seed phrase
const myAccount = wallet.getWallet(seed).deriveAddress(0);
const recipientAccount = wallet.getWallet(seed).deriveAddress(1);

// fill in contract info
const CONTRACT = {
	binary: '608060405234801561001057600080fd5b50610141806100206000396000f3fe608060405260043610610041576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806391a6cb4b14610046575b600080fd5b6100896004803603602081101561005c57600080fd5b81019080803574ffffffffffffffffffffffffffffffffffffffffff16906020019092919050505061008b565b005b8074ffffffffffffffffffffffffffffffffffffffffff164669ffffffffffffffffffff163460405160405180820390838587f1505050508074ffffffffffffffffffffffffffffffffffffffffff167faa65281f5df4b4bd3c71f2ba25905b907205fce0809a816ef8e04b4d496a85bb346040518082815260200191505060405180910390a25056fea165627a7a7230582095190ce167757b6308031ed4b9893929f96d866542f660a6918457a96dac7d870029',    // binary code
	abi: [{ "constant": false, "inputs": [{ "name": "addr", "type": "address" }], "name": "sayHello", "outputs": [], "payable": true, "stateMutability": "payable", "type": "function" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "addr", "type": "address" }, { "indexed": false, "name": "amount", "type": "uint256" }], "name": "transfer", "type": "event" }],                    // JSON ABI
	offChain: '',  // binary offchain code
	address: '',   // contract address
}

CONTRACT.address = 'vite_c1905cc76eaa02c02c564b2afa0639fab53a303cbef0599bd2';

async function receiveTransaction(account) {
	// get the first unreceived tx
	const data = await provider.request('ledger_getUnreceivedBlocksByAddress', account.address, 0, 1);
	if (!data || !data.length) {
		console.log('[LOG] No Unreceived Blocks');
		return;
	}
	// create a receive tx
	const ab = accountBlock.createAccountBlock('receive', {
		address: account.address,
		sendBlockHash: data[0].hash
	}).setProvider(provider).setPrivateKey(account.privateKey);

	await ab.autoSetPreviousAccountBlock();
	const result = await ab.sign().send();
	console.log('receive success', result);
}

async function sendTx(account, address, amount) {
	const ab = accountBlock.createAccountBlock('send', {
		address: account.address,
		toAddress: address,
		amount
	}).setProvider(provider).setPrivateKey(account.privateKey);

	await ab.autoSetPreviousAccountBlock();
	const result = await ab.sign().send();
	console.log('send success', result);
}

async function callContract(account, methodName, abi, params, amount) {
	const block = accountBlock.createAccountBlock('callContract', {
		address: account.address,
		abi,
		methodName,
		amount,
		toAddress: CONTRACT.address,
		params
	}).setProvider(provider).setPrivateKey(account.privateKey);

	await block.autoSetPreviousAccountBlock();
	const result = await block.sign().send();
	console.log('call success', result);
}

async function main() {
	// call the contract we deployed and send over 150 VITE
	await callContract(myAccount, 'sayHello', CONTRACT.abi, [recipientAccount.address], '150000000000000000000');
	// send 10 VITE 
	await sendTx(myAccount, recipientAccount.address, '10000000000000000000');
	// recipient receives the tx
	await receiveTransaction(recipientAccount);
}

main().then(res => { }).catch(err => console.error(err));