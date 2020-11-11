const RLP1 = artifacts.require("RLP1");
const RLP2 = artifacts.require("RLP2");
const keccak256 = require('keccak256')
const RLP = artifacts.require("RLP");
const { bufferToHex, bufferToInt } = require('ethereumjs-util')
const { Account, Header, Log, Proof, Receipt, Transaction } = require('eth-object')
const Web3 = require('web3');


contract('rlp verify', ([owner, alice]) => {
    beforeEach(async () => {
        const rlp = await RLP.new();
        await RLP1.link('RLP', rlp.address);
        await RLP2.link('RLP', rlp.address);
    });
    it('verify header rlp', async function () {
        const blockHex = '0xf90211a05dbc20ff76aeb219b08984b6373e4be230b50db0c784d3cd7fa792ca929c2a5ba01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347945a0b54d5dc17e0aadc383d2db43b0a0d3e029c4ca0946a698b5bd180d307a8fc5045998f381957a9e739a51f3ea010ce233ead16f6a02bbb882b75d225b550f4a925422854b2f25bb2d2a882ecbed6dd7f80b5c446c9a08a5249ef06503334c704b7606ef0f0306cb0d2474e069050a77a46c7cb52faedb90100b5a54ba0b056090c00151c1881145fa9ba10e2c835044084a083248881420b45430541200d701101dd4066409007d9178a4c2287792c26a0281480c8d83c814c4a02a2280ec0cf83f826998eb430f261129c9d0e08edb0042c3211929220a9911822c110a2d8110224b562011ba749b028821e78781c74004852b11c198240a0bfdbd49f8e244000b4c00aa5b088274b1c4e0ac119b0509c621004c0031841128af585893440ae028cc6ffa97940181a0776408280425b0048030264224b264051472982f0305682213256213b12f28d28e0562281e4201c41124f1311f1280010983067654eb518db01aea015a6af1a03903016c28c0040c0481d484a24094e870b951f9771780683a92be983bebc2083beb041845f8d9bdf906574682d70726f2d687a6f2d74303035a070a5dae1d9aa80afc8a8d8ab98825f48cb9d8db8194a6929f1b49b207d97f12c88972c9d98010783e2';
        const blockHeader = Header.fromHex(blockHex);
        console.log('block parentHash', bufferToHex(blockHeader.parentHash)); //0
        console.log('block sha3Uncles', bufferToHex(blockHeader.sha3Uncles)); //1
        console.log('block miner', bufferToHex(blockHeader.miner));  //2
        console.log('block stateRoot', bufferToHex(blockHeader.stateRoot));//3
        console.log('block transactionsRoot', bufferToHex(blockHeader.transactionsRoot));//4
        console.log('block receiptRoot', bufferToHex(blockHeader.receiptRoot));//5
        console.log('block logsBloom', bufferToHex(blockHeader.logsBloom));//6
        console.log('block difficulty', bufferToHex(blockHeader.difficulty));//7
        console.log('block number', bufferToHex(blockHeader.number));//8
        console.log('block gasLimit', bufferToHex(blockHeader.gasLimit));//9
        console.log('block gasUsed', bufferToHex(blockHeader.gasUsed));//10
        console.log('block timestamp', bufferToHex(blockHeader.timestamp));//11
        console.log('block extraData', bufferToHex(blockHeader.extraData));//12
        console.log('block mixHash', bufferToHex(blockHeader.mixHash));//13
        console.log('block nonce', bufferToHex(blockHeader.nonce));//14
        const header = {
            parentHash: blockHeader.parentHash,
            sha3Uncles: blockHeader.sha3Uncles,
            miner: blockHeader.miner,
            stateRoot: blockHeader.stateRoot,
            transactionsRoot: blockHeader.transactionsRoot,
            receiptsRoot: blockHeader.receiptRoot,
            logsBloom: blockHeader.logsBloom,
            difficulty: blockHeader.difficulty,
            number: blockHeader.number,
            gasLimit: blockHeader.gasLimit,
            gasUsed: blockHeader.gasUsed,
            timestamp: blockHeader.timestamp,
            extraData: blockHeader.extraData,
            mixHash: blockHeader.mixHash,
            nonce: blockHeader.nonce,
            raw: '0x'
        };

        const blockHash = '0x4a419022aa83efd6332ac4a0a0b5be84591a025e73a33086fe918b03bc11de41';
        {
            const bridge = await RLP1.new();
            await bridge.verifyHeader(blockHash, header);

            const raw = await bridge.raw();
            console.log('result', raw);

            const hash = await bridge.headerHash();
            console.log('result hash', hash);
        }
        {
            const headers = [
                blockHeader.parentHash,
                blockHeader.sha3Uncles,
                blockHeader.miner,
                blockHeader.stateRoot,
                blockHeader.transactionsRoot,
                blockHeader.receiptRoot,
                blockHeader.logsBloom,
                blockHeader.difficulty,
                blockHeader.number,
                blockHeader.gasLimit,
                blockHeader.gasUsed,
                blockHeader.timestamp,
                blockHeader.extraData,
                blockHeader.mixHash,
                blockHeader.nonce,
            ];


            const bridge = await RLP2.new();
            await bridge.verifyHeader(blockHash, headers);
        }
    });
});

