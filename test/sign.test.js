var EthUtil = require('ethereumjs-util');

const messageToSign = "hello world";
const privateKey = "c5c2d2160e006957d584aa8804be22c94ab8875a9f013d4526ffcf0115fb8d83";

const keccak256 = require('keccak256')
const msgHash = keccak256(messageToSign);


var signature = EthUtil.ecsign(msgHash, new Buffer(privateKey, 'hex'));
var signatureRPC = EthUtil.toRpcSig(signature.v, signature.r, signature.s)

console.log('0xbbbcca2de5d29dabbc8b92c85cdcf66a157877dd');
console.log(signatureRPC);
//
//
// var Wallet = require('ethereumjs-wallet');
//
// let signers = [];
// let keys = [];
// for (let i = 0; i < 10; i++) {
//     const EthWallet = Wallet.generate();
//     signers.push(EthWallet.getAddressString());
//     keys.push(EthWallet.getPrivateKeyString());
// }
//
// console.log(signers);
// console.log(keys);
//
//
// new Buffer(0).writeBigUInt64BE(12)

var abi = require('ethereumjs-abi')

// returns the encoded binary (as a Buffer) data to be sent
var encoded = abi.rawEncode(["address"], ["0x627306090abaB3A6e1400e9345bC60c78a8BEf57"])

console.log('0x' + encoded.toString('hex'));


// returns the encoded binary (as a Buffer) data to be sent
var encoded = abi.rawEncode(["bytes32"], ['0x88'])

console.log('0x' + encoded.toString('hex'));

var encoded = abi.solidityPack(['uint64', 'bytes32', 'address'], ['99', '0x88', '0x627306090abaB3A6e1400e9345bC60c78a8BEf57']);

console.log('0x' + encoded.toString('hex'));

var encoded = abi.solidityPack(['address[]'], [['0x627306090abaB3A6e1400e9345bC60c78a8BEf57', '0x627306090abaB3A6e1400e9345bC60c78a8BEf57']]);

console.log('0x' + encoded.toString('hex'));
