const StarkToken = artifacts.require('StarkToken.sol');

contract(StarkToken, (accounts) => {

    it("assigns the correct supply of tokens", async () => {
        var tokenInstance = await StarkToken.deployed();
        var totalSupply = await tokenInstance.totalSupply()

        assert.equal(totalSupply.toNumber(), 1000000,"total supply is initialized properly")
    })

})