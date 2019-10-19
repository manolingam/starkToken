const StarkToken = artifacts.require("StarkToken");
const StarkTokenSale = artifacts.require('StarkTokenSale');

module.exports = function(deployer) {
  deployer.deploy(StarkToken, 1000000).then(() => {
    var tokenPrice = 1000000000000000;
    return deployer.deploy(StarkTokenSale, StarkToken.address, tokenPrice);
  })
};
