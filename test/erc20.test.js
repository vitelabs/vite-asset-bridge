const MockToken = artifacts.require("MockERC20Token");

contract('MockERC20Token', ([owner, alice]) => {
    before(async () => {
        this.mockToken = await MockToken.deployed();
    });

    it('erc20 balanceOf', async () => {
        let ownerBalance = await this.mockToken.balanceOf(owner);
        assert.equal(ownerBalance.toString(), '0');

        let aliceBalance = await this.mockToken.balanceOf(alice);
        assert.equal(aliceBalance.toString(), '0');
    });

    it('erc20 mint', async () => {
        await this.mockToken.mint(alice, 10, {from: owner});

        let aliceBalance = await this.mockToken.balanceOf(alice);
        assert.equal(aliceBalance.toString(), '10');
    });

});

