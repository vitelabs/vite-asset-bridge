const Web3 = require('web3');
const RLP = require('rlp');
const keccak256 = require('keccak256')
const { encode, toBuffer } = require('eth-util-lite')
const assert = require('chai').assert;
// const BaseTrie = require('merkle-patricia-tree')
const { BaseTrie: Trie } = require('merkle-patricia-tree')
const { bufferToHex, bufferToInt, rlp } = require('ethereumjs-util')
const { Account, Header, Log, Proof, Receipt, Transaction } = require('eth-object')
const { MerklePatriciaTree, VerifyWitness } = require('@rainblock/merkle-patricia-tree');


function blockToHex(block) {
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

var rawStack = (input) => {
    output = []
    for (var i = 0; i < input.length; i++) {
        output.push(input[i].raw)
    }
    return output
}
describe('eth block proof', () => {
    let web3 = new Web3(Web3.givenProvider || "https://mainnet.infura.io/v3/1eb4df8ef74f487eb132a2b312737e80");


    // it('print block', async () => {
    //     const height=11086825;
    //     for(let i=0;i<10;i++){
    //         const block = await web3.eth.getBlock(Number(height+i), false);
    //         const blockHex = blockToHex(block);
    //         console.log(height+i, blockHex);
    //     }
    // });
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

    it('receipt proof verify', async () => {
        try {
            // const tx = await web3.eth.getTransaction('0x92e94b3ac35eb7a34fde6d4b24337f7c6db2ede68e2b564b81ff4b0fe4d7a8f3');
            // console.log(tx);

            // const receipt = await web3.eth.getTransactionReceipt('0x92e94b3ac35eb7a34fde6d4b24337f7c6db2ede68e2b564b81ff4b0fe4d7a8f3');
            // console.log(JSON.stringify(receipt));

            let blockHash = '0x4a419022aa83efd6332ac4a0a0b5be84591a025e73a33086fe918b03bc11de41';
            const block = await web3.eth.getBlock(blockHash);
            let receipts = await Promise.all(block.transactions.map((txHash) => {
                return web3.eth.getTransactionReceipt(txHash)
            }));

            let trie = new Trie();

            let tree = new MerklePatriciaTree();
            await Promise.all(receipts.map((receipt) => {
                receipt.status = receipt.status ? 1 : 0;
                let logs = []
                for (let i = 0; i < receipt.logs.length; i++) {
                    logs.push(
                        [
                            receipt.logs[i].address,
                            receipt.logs[i].topics,
                            receipt.logs[i].data
                        ]
                    )
                }
                const raw = RLP.encode([
                    toBuffer(receipt.status || undefined),
                    toBuffer(receipt.cumulativeGasUsed),
                    receipt.logsBloom,
                    logs
                ]);
                const serialize = Receipt.fromRpc(receipt).serialize();
                assert.equal(bufferToHex(raw), bufferToHex(serialize));

                return trie.put(encode(receipt.transactionIndex), raw);
            }));
            assert.equal(bufferToHex(trie.root), block.receiptsRoot);
            // for (let i = 0; i < receipts.length; i++) {
            const proofs = await Trie.createProof(trie, encode(202));
            console.log(bufferToHex(RLP.encode(proofs)));
            //     console.log(i, proofs.length, '----------------');
            //     // console.log(proofs[0]);
            //     // console.log(proofs[1]);
            //     // console.log(proofs[2]);
            //     // assert.equal(bufferToHex(keccak256(RLP.encode(proofs))), bufferToHex(trie.root));
            //     const key = await Trie.verifyProof(trie.root, encode(i), proofs);
            //     assert.equal(bufferToHex(key), bufferToHex(Receipt.fromRpc(receipts[i]).serialize()));
            //     assert.isTrue(verify(encode(i).toString('hex'), key, encode(proofs), trie.root));
            // }
        } catch (e) {
            console.error(e);
            assert.fail();
        }
    });

    // it('receipt ', async () => {
    //     const receipt = await web3.eth.getTransactionReceipt('0x0aafe6194bec66ca9e85cd578233e91709f2325db979c9134efdad60f3cbbad6')
    //     receipt.status = receipt.status ? 1 : 0;
    //     let logs = []
    //     for (let i = 0; i < receipt.logs.length; i++) {
    //         const log = [
    //             receipt.logs[i].address,
    //             receipt.logs[i].topics,
    //             receipt.logs[i].data
    //         ]
    //         logs.push(log);

    //         console.log('receipt',i,bufferToHex(RLP.encode(log)));
    //     }
    //     const raw = RLP.encode([
    //         toBuffer(receipt.status || undefined),
    //         toBuffer(receipt.cumulativeGasUsed),
    //         receipt.logsBloom,
    //         logs
    //     ]);
    //     const serialize = Receipt.fromRpc(receipt).serialize();

    //     console.log(bufferToHex(serialize));
    // });

    // it('receipt 2', async() =>{
    //     const arr = RLP.decode(toBuffer('0xf906710183aa0943b9010010204000000000000004000080000000000000000000000000010000000000000000000000000000000000000000000202000000080000000000000000280000000000000000000008000008000002600000000000040000000000000000000000000000200000000000000000004000000000000000000000000010000000000000000000000000004000000000000800000000010000080000004000000000020000000000200200000000000010000000000000000000000000000000000040000802000000000000002000000000000000000000001000000000000020000018200000000000000000000000000000000000000000000000000000000000f90566f89b94021576770cb3729716ccfb687afdb4c6bf720cb6f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa0000000000000000000000000efd0199657b444856e3259ed8e3c39ee43cf51dca0000000000000000000000000e3e15b09e1a8cb96032690448a18173b170a8d5ca0000000000000000000000000000000000000000000000001962cde83c99ac832f89b94021576770cb3729716ccfb687afdb4c6bf720cb6f863a08c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925a0000000000000000000000000efd0199657b444856e3259ed8e3c39ee43cf51dca00000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488da0fffffffffffffffffffffffffffffffffffffffffffffffa4fbcd49f75a5945af89b94c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa0000000000000000000000000e3e15b09e1a8cb96032690448a18173b170a8d5ca0000000000000000000000000b4e16d0168e52d35cacd2c6185b44281ec28c9dca000000000000000000000000000000000000000000000000003bc43ef4c08a8e6f87994e3e15b09e1a8cb96032690448a18173b170a8d5ce1a01c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1b84000000000000000000000000000000000000000000000017bf9d63930dacb54b00000000000000000000000000000000000000000000000037d876b38ca168e53f8fc94e3e15b09e1a8cb96032690448a18173b170a8d5cf863a0d78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822a00000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488da0000000000000000000000000b4e16d0168e52d35cacd2c6185b44281ec28c9dcb880000000000000000000000000000000000000000000000001962cde83c99ac8320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003bc43ef4c08a8e6f89b94a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa0000000000000000000000000b4e16d0168e52d35cacd2c6185b44281ec28c9dca0000000000000000000000000efd0199657b444856e3259ed8e3c39ee43cf51dca000000000000000000000000000000000000000000000000000000000061437acf87994b4e16d0168e52d35cacd2c6185b44281ec28c9dce1a01c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1b84000000000000000000000000000000000000000000000000000010c295dbacc7300000000000000000000000000000000000000000000a44929ecfbcd22a6264bf8fc94b4e16d0168e52d35cacd2c6185b44281ec28c9dcf863a0d78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822a00000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488da0000000000000000000000000efd0199657b444856e3259ed8e3c39ee43cf51dcb880000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003bc43ef4c08a8e600000000000000000000000000000000000000000000000000000000061437ac0000000000000000000000000000000000000000000000000000000000000000'));
    //     console.log(bufferToHex(arr[0]));
    //     console.log(bufferToHex(arr[1]));
    //     console.log(bufferToHex(arr[0]));
    // });


    // it('receipt hash verify2', async () => {
    //     const value = toBuffer('0xf9043a01830196aab9010000200000000000000000000080000000000000000000000000000000000000000000000000000000000000001004000002000000080000000000000000000000000000000000000000000008000000200000000000400000000000000000000000000000000000000000000000000000000000000000040000000010000200000000400000000000000000000000040000080000000000082000004000000000000000000000000000400000000000000000000000000000000100000000000000000102000000000000000000000000000000020000001000000002000000000000200000000000000000000000000000000000000000000000010000000000f9032ff89b947a9277aa08a633766461351ec00996a0cbe905adf863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965a0000000000000000000000000e1ee482eefd3fc379b7154399f8d52956fb3c520a0000000000000000000000000000000000000000000000008252610ddca3f2a7cf89b94c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa0000000000000000000000000e1ee482eefd3fc379b7154399f8d52956fb3c520a00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965a00000000000000000000000000000000000000000000000006dd1d3e675d12ca8f87994e1ee482eefd3fc379b7154399f8d52956fb3c520e1a01c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1b84000000000000000000000000000000000000000000000008137f863472c77294900000000000000000000000000000000000000000000000665553354489d7a49f8fc94e1ee482eefd3fc379b7154399f8d52956fb3c520f863a0d78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822a00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965a00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965b880000000000000000000000000000000000000000000000008252610ddca3f2a7c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006dd1d3e675d12ca8f87a94c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2f842a07fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65a00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965a00000000000000000000000000000000000000000000000006dd1d3e675d12ca9');
    //     const encodedPath = encode(0);
    //     const proofs = toBuffer('0xf905d3b90134f90131a0da224d56bce5841673a059da3d3625b5d14b3d95e1333253df4853d4de332e84a099c693c82f2c8883be479ef1f729d3fe3bb865f5f81d3239f810b047cd1aac0ea031e20b5e3ff892f350e1b0769ab0957ac295f9000d2170c9b86c1dfde38067d4a07378e0c3c8a819f6c7fde2e6a39d2c304088d2465cdb192c3766d5d8073432d8a00363d020fd44a89dabf2c1663117dde76f88c842e03de3daacece3ec9b79e63aa0a33dbe0b21cca068091b3443dd16f895fbb8c12b44891c8a51054e45ff3bf39da0d71863db1af1486822e0c6700c0ea8c912853b9eed6d90d078a788ca0118370fa0a3da2ffc13ffec1a9aa3891f72db9a430fa6470308e011583c67a339ec77c9bea0895072c8b994ad86b685735475dd335b06bdeaf7f6c7398bdebf09686314ee078080808080808080b853f851a0a55653bbffc1067439bfb89d05461769df318adb2185f30f91daf45126b9f494a060e55c1901f62e70f3f5bc6de8e57c4f41b097819fb7ec3303ade67513d4580e808080808080808080808080808080b90444f9044120b9043df9043a01830196aab9010000200000000000000000000080000000000000000000000000000000000000000000000000000000000000001004000002000000080000000000000000000000000000000000000000000008000000200000000000400000000000000000000000000000000000000000000000000000000000000000040000000010000200000000400000000000000000000000040000080000000000082000004000000000000000000000000000400000000000000000000000000000000100000000000000000102000000000000000000000000000000020000001000000002000000000000200000000000000000000000000000000000000000000000010000000000f9032ff89b947a9277aa08a633766461351ec00996a0cbe905adf863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965a0000000000000000000000000e1ee482eefd3fc379b7154399f8d52956fb3c520a0000000000000000000000000000000000000000000000008252610ddca3f2a7cf89b94c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa0000000000000000000000000e1ee482eefd3fc379b7154399f8d52956fb3c520a00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965a00000000000000000000000000000000000000000000000006dd1d3e675d12ca8f87994e1ee482eefd3fc379b7154399f8d52956fb3c520e1a01c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1b84000000000000000000000000000000000000000000000008137f863472c77294900000000000000000000000000000000000000000000000665553354489d7a49f8fc94e1ee482eefd3fc379b7154399f8d52956fb3c520f863a0d78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822a00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965a00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965b880000000000000000000000000000000000000000000000008252610ddca3f2a7c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006dd1d3e675d12ca8f87a94c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2f842a07fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65a00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965a00000000000000000000000000000000000000000000000006dd1d3e675d12ca9');
    //     const root = toBuffer('0x8a5249ef06503334c704b7606ef0f0306cb0d2474e069050a77a46c7cb52faed');

    //     const result = verify(
    //         encodedPath.toString('hex'),
    //         value,
    //         proofs,
    //         root);

    //     console.log(result);
    //     // console.log(verify());
    // });

});

function verify(path, value, proofs, txRoot) {
    // const path = encode(0).toString('hex');
    // const value = toBuffer('0xf9043a01830196aab9010000200000000000000000000080000000000000000000000000000000000000000000000000000000000000001004000002000000080000000000000000000000000000000000000000000008000000200000000000400000000000000000000000000000000000000000000000000000000000000000040000000010000200000000400000000000000000000000040000080000000000082000004000000000000000000000000000400000000000000000000000000000000100000000000000000102000000000000000000000000000000020000001000000002000000000000200000000000000000000000000000000000000000000000010000000000f9032ff89b947a9277aa08a633766461351ec00996a0cbe905adf863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965a0000000000000000000000000e1ee482eefd3fc379b7154399f8d52956fb3c520a0000000000000000000000000000000000000000000000008252610ddca3f2a7cf89b94c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa0000000000000000000000000e1ee482eefd3fc379b7154399f8d52956fb3c520a00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965a00000000000000000000000000000000000000000000000006dd1d3e675d12ca8f87994e1ee482eefd3fc379b7154399f8d52956fb3c520e1a01c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1b84000000000000000000000000000000000000000000000008137f863472c77294900000000000000000000000000000000000000000000000665553354489d7a49f8fc94e1ee482eefd3fc379b7154399f8d52956fb3c520f863a0d78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822a00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965a00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965b880000000000000000000000000000000000000000000000008252610ddca3f2a7c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006dd1d3e675d12ca8f87a94c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2f842a07fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65a00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965a00000000000000000000000000000000000000000000000006dd1d3e675d12ca9');
    // const parentNodes = [
    //     toBuffer('0xf90131a0da224d56bce5841673a059da3d3625b5d14b3d95e1333253df4853d4de332e84a099c693c82f2c8883be479ef1f729d3fe3bb865f5f81d3239f810b047cd1aac0ea031e20b5e3ff892f350e1b0769ab0957ac295f9000d2170c9b86c1dfde38067d4a07378e0c3c8a819f6c7fde2e6a39d2c304088d2465cdb192c3766d5d8073432d8a00363d020fd44a89dabf2c1663117dde76f88c842e03de3daacece3ec9b79e63aa0a33dbe0b21cca068091b3443dd16f895fbb8c12b44891c8a51054e45ff3bf39da0d71863db1af1486822e0c6700c0ea8c912853b9eed6d90d078a788ca0118370fa0a3da2ffc13ffec1a9aa3891f72db9a430fa6470308e011583c67a339ec77c9bea0895072c8b994ad86b685735475dd335b06bdeaf7f6c7398bdebf09686314ee078080808080808080'),
    //     toBuffer('0xf851a0a55653bbffc1067439bfb89d05461769df318adb2185f30f91daf45126b9f494a060e55c1901f62e70f3f5bc6de8e57c4f41b097819fb7ec3303ade67513d4580e808080808080808080808080808080'),
    //     toBuffer('0xf9044120b9043df9043a01830196aab9010000200000000000000000000080000000000000000000000000000000000000000000000000000000000000001004000002000000080000000000000000000000000000000000000000000008000000200000000000400000000000000000000000000000000000000000000000000000000000000000040000000010000200000000400000000000000000000000040000080000000000082000004000000000000000000000000000400000000000000000000000000000000100000000000000000102000000000000000000000000000000020000001000000002000000000000200000000000000000000000000000000000000000000000010000000000f9032ff89b947a9277aa08a633766461351ec00996a0cbe905adf863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965a0000000000000000000000000e1ee482eefd3fc379b7154399f8d52956fb3c520a0000000000000000000000000000000000000000000000008252610ddca3f2a7cf89b94c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa0000000000000000000000000e1ee482eefd3fc379b7154399f8d52956fb3c520a00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965a00000000000000000000000000000000000000000000000006dd1d3e675d12ca8f87994e1ee482eefd3fc379b7154399f8d52956fb3c520e1a01c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1b84000000000000000000000000000000000000000000000008137f863472c77294900000000000000000000000000000000000000000000000665553354489d7a49f8fc94e1ee482eefd3fc379b7154399f8d52956fb3c520f863a0d78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822a00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965a00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965b880000000000000000000000000000000000000000000000008252610ddca3f2a7c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006dd1d3e675d12ca8f87a94c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2f842a07fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65a00000000000000000000000003e1804fa401d96c48bed5a9de10b6a5c99a53965a00000000000000000000000000000000000000000000000006dd1d3e675d12ca9')
    // ];
    // const txRoot = '0x8a5249ef06503334c704b7606ef0f0306cb0d2474e069050a77a46c7cb52faed';

    // console.log("proofs", bufferToHex(encode(parentNodes)));
    // console.log("path", bufferToHex(encode(0)));
    // console.log("value", bufferToHex(value));

    try {
        var parentNodes = rlp.decode(proofs);
        var currentNode;
        var len = parentNodes.length;
        var nodeKey = toBuffer(txRoot);
        var pathPtr = 0;

        for (var i = 0; i < len; i++) {
            currentNode = RLP.decode(parentNodes[i]);
            // console.log(nodeKey);
            // console.log(currentNode.length, '-------------------');
            // console.log(currentNode);
            // console.log(keccak256(encode(currentNode)));


            // console.log(bufferToHex(nodeKey), bufferToHex(keccak256(encode(currentNode))));
            if (!nodeKey.equals(keccak256(encode(currentNode)))) {
                return false;
            }

            if (pathPtr > path.length) {
                return false
            }
            // console.log(currentNode.length, )
            switch (currentNode.length) {
                case 17://branch node
                    if (pathPtr == path.length) {
                        if (currentNode[16] == (value)) {
                            return true;
                        } else {
                            return false
                        }
                    }
                    // console.log(pathPtr, path, parseInt(path[pathPtr], 16), path.length);
                    nodeKey = currentNode[parseInt(path[pathPtr], 16)] //must == sha3(rlp.encode(currentNode[path[pathptr]]))
                    pathPtr += 1
                    break;
                case 2:
                    // 0xa55653bbffc1067439bfb89d05461769df318adb2185f30f91daf45126b9f494
                    console.log("nibbles to traverse", bufferToHex(currentNode[0]));
                    pathPtr += nibblesToTraverse(currentNode[0].toString('hex'), path, pathPtr)
                    if (pathPtr == path.length) {//leaf node
                        if (currentNode[1].equals(value)) {
                            return true
                        } else {
                            return false
                        }
                    } else {//extension node
                        nodeKey = currentNode[1]
                    }
                    break;
                default:
                    console.log("all nodes must be length 17 or 2");
                    return false
            }
        }
    } catch (e) { console.log(e); return false }
    return false
}

var nibblesToTraverse = (encodedPartialPath, path, pathPtr) => {
    if (encodedPartialPath[0] == 0 || encodedPartialPath[0] == 2) {
        var partialPath = encodedPartialPath.slice(2)
    } else {
        var partialPath = encodedPartialPath.slice(1)
    }

    console.log(partialPath, path, pathPtr, partialPath.length, "------==================");
    if (partialPath == path.slice(pathPtr, pathPtr + partialPath.length)) {
        return partialPath.length
    } else {
        throw new Error("path was wrong")
    }
}


// left-pad half-bytes
function ensureByte(s) {
    if (s.substr(0, 2) == '0x') { s = s.slice(2); }
    if (s.length % 2 == 0) { return `0x${s}`; }
    else { return `0x0${s}`; }
}
