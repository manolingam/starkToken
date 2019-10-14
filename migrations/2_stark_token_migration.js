const StarkToken = artifacts.require("StarkToken");

module.exports = function(deployer) {
  deployer.deploy(StarkToken);
};
