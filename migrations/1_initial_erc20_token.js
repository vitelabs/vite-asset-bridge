const MockToken = artifacts.require("MockERC20Token");

module.exports = function(deployer) {
  deployer.deploy(MockToken);
};
