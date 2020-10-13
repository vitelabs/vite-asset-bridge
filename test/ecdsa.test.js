const ECDSAMock = artifacts.require("Tools");
const keccak256 = require('keccak256')

const TEST_MESSAGE = keccak256('hello world');

contract('ECDSA', ([owner, alice]) => {
    const signer = '0xbbbcca2de5d29dabbc8b92c85cdcf66a157877dd';
    // eslint-disable-next-line max-len
    const signatureWithoutVersion = '0x369b2513b34fc3de33c2af602f57ce51e9600dc67f2253e4923bd53ae1f4416653cc06e30649fcad09cccb56bb165f28a72a795affa267dbf8a9ee8c6066db641b';
    let ecdsa;
    beforeEach(async () => {
        ecdsa = await ECDSAMock.new();
    });

    it('with 28 as version value', async function () {
        const version = '1c'; // 28 = 1c.
        const signature = signatureWithoutVersion;
        const addr = await ecdsa.recover(TEST_MESSAGE, signature)
        assert.equal(addr.toString().toLowerCase(), signer.toLowerCase());
    });
});

