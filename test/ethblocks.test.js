const Web3 = require('web3');
const RLP = require('rlp');
const keccak256 = require('keccak256')
const { encode, toBuffer } = require('eth-util-lite')
const assert = require('chai').assert;
// const BaseTrie = require('merkle-patricia-tree')
const { BaseTrie: Trie } = require('merkle-patricia-tree')
const { bufferToHex, bufferToInt } = require('ethereumjs-util')
const { Account, Header, Log, Proof, Receipt, Transaction } = require('eth-object')


function blockToHex(block){
    const nestedList = [
        block.parentHash,
        block.sha3Uncles,
        block.miner,
        block.stateRoot,
        block.transactionsRoot,
        block.receiptsRoot,
        block.logsBloom,
        Number(block.difficulty),
        Number(block.number),
        Number(block.gasLimit),
        Number(block.gasUsed),
        Number(block.timestamp),
        block.extraData,
        block.mixHash,
        block.nonce
    ];
    const encoded = RLP.encode(nestedList);
    return bufferToHex(encoded);
}

describe('eth block proof', () => {
    let web3 = new Web3(Web3.givenProvider || "https://mainnet.infura.io/v3/1eb4df8ef74f487eb132a2b312737e80");


    it('print block', async () => {
        const height=11086825;
        for(let i=0;i<10;i++){
            const block = await web3.eth.getBlock(Number(height+i), false);
            const blockHex = blockToHex(block);
            console.log(height+i, blockHex);
        }
    });
    // it('block hash verify', async () => {
    //     try {

    //         let blockHash = '0x4a419022aa83efd6332ac4a0a0b5be84591a025e73a33086fe918b03bc11de41';
    //         const block = await web3.eth.getBlock(blockHash);
    //         console.log('block', JSON.stringify(block));
    //         console.log('block hex', bufferToHex(Header.fromRpc(block).serialize()));
    //         console.log(keccak256(Header.fromRpc(block).serialize()).toString('hex'));
    //         const blockHeader = Header.fromRpc(block)
    //         const nestedList = [
    //             block.parentHash,
    //             block.sha3Uncles,
    //             block.miner,
    //             block.stateRoot,
    //             block.transactionsRoot,
    //             block.receiptsRoot,
    //             block.logsBloom,
    //             Number(block.difficulty),
    //             Number(block.number),
    //             Number(block.gasLimit),
    //             Number(block.gasUsed),
    //             Number(block.timestamp),
    //             block.extraData,
    //             block.mixHash,
    //             block.nonce
    //         ];
    //         console.log("difficulty 1", RLP.encode(block.difficulty));
    //         console.log("difficulty 1", block.difficulty);
    //         console.log("difficulty 1", Number(block.difficulty));
    //         console.log("difficulty 1", Number(block.difficulty).toString(16));
    //         console.log("difficulty 2", bufferToHex(Header.fromRpc(block).difficulty));
    //         const encoded = RLP.encode(nestedList);
    //         console.log("hex block hash", blockHash);
    //         console.log("hex block", bufferToHex(encoded));
    //         assert.equal('0x' + keccak256(encoded).toString('hex'), blockHash);
    //     } catch (e) {
    //         console.error(e);
    //     }
    // });

    // it('receipt hash verify', async () => {
    //     try {
    //         // const tx = await web3.eth.getTransaction('0x92e94b3ac35eb7a34fde6d4b24337f7c6db2ede68e2b564b81ff4b0fe4d7a8f3');
    //         // console.log(tx);

    //         // const receipt = await web3.eth.getTransactionReceipt('0x92e94b3ac35eb7a34fde6d4b24337f7c6db2ede68e2b564b81ff4b0fe4d7a8f3');
    //         // console.log(JSON.stringify(receipt));

    //         let blockHash = '0x4a419022aa83efd6332ac4a0a0b5be84591a025e73a33086fe918b03bc11de41';
    //         const block = await web3.eth.getBlock(blockHash);
    //         let receipts = await Promise.all(block.transactions.map((txHash) => {
    //             return web3.eth.getTransactionReceipt(txHash)
    //         }));

    //         let trie = new Trie();
    //         await Promise.all(receipts.map((receipt) => {
    //             receipt.status = receipt.status ? 1 : 0;
    //             let logs = []
    //             for (let i = 0; i < receipt.logs.length; i++) {
    //                 logs.push(
    //                     [
    //                         receipt.logs[i].address,
    //                         receipt.logs[i].topics,
    //                         receipt.logs[i].data
    //                     ]
    //                 )
    //             }
    //             const raw = RLP.encode([
    //                 toBuffer(receipt.status || undefined),
    //                 toBuffer(receipt.cumulativeGasUsed),
    //                 receipt.logsBloom,
    //                 logs
    //             ]);
    //             const serialize = Receipt.fromRpc(receipt).serialize();
    //             assert.equal(bufferToHex(raw), bufferToHex(serialize));
    //             return trie.put(encode(receipt.transactionIndex), raw)
    //         }));
    //         assert.equal(bufferToHex(trie.root), block.receiptsRoot);

    //         for (let i = 0; i < receipts.length; i++) {
    //             const proofs = await Trie.createProof(trie, encode(i));
    //             const key = await Trie.verifyProof(trie.root, encode(i), proofs)
    //             assert.equal(bufferToHex(key), bufferToHex(Receipt.fromRpc(receipts[i]).serialize()));
    //         }
    //     } catch (e) {
    //         console.error(e);
    //         assert.fail();
    //     }
    // });
});