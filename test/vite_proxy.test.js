const abi = require('ethereumjs-abi')
const {MerkleTree} = require('merkletreejs')
const keccak256 = require('keccak256')
const EthUtil = require('ethereumjs-util');
const ViteProxy = artifacts.require("ViteProxy");

const buf2hex = x => '0x' + x.toString('hex')

const defaultSigners = [
    '0xbbbcca2de5d29dabbc8b92c85cdcf66a157877dd',
    '0x1e2d1276d297f432017d09d2b852ea33dbde65ba',
    '0x9f3e765cccfb3800f219cbe5d7ed817142befa55',
    '0xac89d11542172718211210f328294af56686aeae',
    '0xc8ed0fcee922430e65d777fc56302a3298618789',
    '0x896427f93d846eb76cc9f12286b2e26d4943bbde',
    '0x869cbb7ebc7bc827ef19560ef9108c581370ec7c',
    '0x092f7a0e7f3516e5372a406c890a42f20092823e',
    '0x155e59e8cd3cab6832f54bc9c54c94f42e9c030d',
    '0xe1dd1ce09c4dd3bf6c9d44e70b1f7c209a9de346'
];

const keysMap = keys();

function keys() {
    const defaultKeys = [
        'c5c2d2160e006957d584aa8804be22c94ab8875a9f013d4526ffcf0115fb8d83',
        '86ff04f0189458409af0c08da579d5d20a6baaa8fb764789b9038bef149881f7',
        '37b69900073dd5a7ac67c27ca67c717285558d6127ec5891e3a453d6200adaef',
        '09784310b98468077cd790b983c91d41b5bbb4072b2c075d34fee798fe16072a',
        '4c9b47a6a8c95d76d08236ba0cb7a78126e94fff6003404c23dc51048feda075',
        '10e44a9d6306175169e9c5d5667b011e06e8e52fd84e6f08409b477734fa32b9',
        '449fd50f76fd983f804380d64522669d3da051303e84530792c8aff69242a7d7',
        '0206c87b667d8372bbb3125c191e914c41ede3dffa38a86c9844b682e5108d1d',
        '772dc1d229e9ffeb89811823ee4e56e0548c02b624458c62091037bee5ff84cb',
        '997bed3edb00d3dc25af966199336aeeaaad12db3a92ec9a13d0cce04fa30c77'
    ];
    let result = {};
    for (let i = 0; i < defaultSigners.length; i++) {
        result[defaultSigners[i].toLowerCase()] = defaultKeys[i];
    }
    return result;
}


function sign(nonce, root, signers) {
    let signatures = [];

    for (let i = 0; i < signers.length; i++) {
        const hash = keccak256(abi.solidityPack(['uint64', 'bytes32'], [nonce, root]));
        const signature = EthUtil.ecsign(hash, new Buffer(keysMap[signers[i]], 'hex'));
        signatures.push(EthUtil.toRpcSig(signature.v, signature.r, signature.s));
    }
    return signatures;
}

function merkleRootAndProofs(signersHash, txHashes) {
    const leaves = [signersHash].concat(txHashes);
    const tree = new MerkleTree(leaves, keccak256, {sort: true})
    // const root = tree.getHexRoot()
    // const signersProof = tree.getHexProof(signersHash)
    // const txProof = tree.getHexProof(txHash)
    return tree
}

function merkleInfo(signersHash) {
    const txHash = keccak256('hello hash');
    const tree = merkleRootAndProofs(signersHash, [txHash]);
    return tree;
}


function merkleTxs(txs) {
    const signersHash = keccak256('hello hash');
    const tree = merkleRootAndProofs(signersHash, txs);
    return tree;
}

function generateSignersProof(signers) {

}

contract('ViteProxy', (accounts) => {
    let viteProxy;
    let owner = accounts[0];
    let sbpNum = 10;
    let signers = [];
    let nonce = 0;

    beforeEach(async () => {
        nonce = 19;
        signers = defaultSigners.slice(0, sbpNum).map(m => m.toLowerCase()).sort();
        viteProxy = await ViteProxy.new(signers, nonce);
    });


    it('submitProof', async () => {
        const signNum = sbpNum - 1;
        let currentSigners = defaultSigners.slice(0, signNum).map(m => m.toLowerCase()).sort()

        const sigProof = {
            rootNonce: nonce + 1,
            root: '0x000',
            signatures: [],
            signers: currentSigners
        }
        sigProof.signatures = sign(sigProof.rootNonce, sigProof.root, sigProof.signers);
        {
            let nowNonce = await viteProxy.viteNonce();
            assert.equal(nowNonce.toString(), (nonce).toString());
        }
        await viteProxy.submitProof(sigProof);
        {
            let nowNonce = await viteProxy.viteNonce();
            assert.equal(nowNonce.toString(), (nonce + 1).toString());
        }
    });

    it('submitSigners', async () => {
        const signNum = sbpNum - 1;
        const currentSigners = defaultSigners.slice(0, signNum).map(m => m.toLowerCase()).sort()

        const sigProof = {
            rootNonce: nonce + 1,
            root: '0x000',
            signatures: [],
            signers: currentSigners
        }
        const signersProof = {
            signers: accounts.slice(0, sbpNum).map(m => m.toLowerCase()).sort(),
            proof: ['0x00']
        }
        {
            const signersHash = keccak256(abi.solidityPack(['address[]'], [signersProof.signers]));
            let tree = merkleInfo(signersHash);
            sigProof.root = tree.getHexRoot();
            signersProof.proof = tree.getHexProof(signersHash)
            sigProof.signatures = sign(sigProof.rootNonce, sigProof.root, sigProof.signers);
        }
        {
            let nowNonce = await viteProxy.viteNonce();
            assert.equal(nowNonce.toString(), (nonce).toString());
        }
        await viteProxy.submitSigners(sigProof, signersProof);
        {
            let nowNonce = await viteProxy.viteNonce();
            assert.equal(nowNonce.toString(), (nonce + 1).toString());
        }
    });

    it('txApproved', async () => {
        const txHashes = ['hello world 1', 'hello world 2']
            .map(t => keccak256(t));
        const tx = {txHash: txHashes[0], proof: []};
        {
            const signNum = sbpNum - 1;
            let currentSigners = defaultSigners.slice(0, signNum).map(m => m.toLowerCase()).sort()

            const sigProof = {
                rootNonce: nonce + 1,
                root: '',
                signatures: [],
                signers: currentSigners
            }
            let tree = merkleTxs(txHashes);
            sigProof.root = tree.getHexRoot();
            sigProof.signatures = sign(sigProof.rootNonce, sigProof.root, sigProof.signers);
            tx.proof = tree.getHexProof(tx.txHash);
            await viteProxy.submitProof(sigProof);
        }

        let result = await viteProxy.txApproved(nonce + 1, tx);
        assert.equal(result, true);
        let result2 = await viteProxy.txApproved(nonce, tx);
        assert.equal(result2, false);
    });
});
