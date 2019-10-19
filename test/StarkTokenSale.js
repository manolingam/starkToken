var StarkTokenSale = artifacts.require('./StarkTokenSale.sol');
var StarkToken = artifacts.require('./StarkToken.sol');

contract(StarkTokenSale, (accounts) => {

    var admin = accounts[0]
    var buyer = accounts[1]
    var tokenInstance;
    var tokenSaleInstance;
    var tokenPrice = 1000000000000000;
    var numberOfTokens = 750000;

    it("initializes the contract with proper values", () => {
        return StarkTokenSale.deployed().then((instance) => {
            tokenSaleInstance = instance;
            return tokenSaleInstance.address
        }).then((address) => {
            assert.notEqual(address, 0x0, "starkTokenSale contract has a valid address")
            return tokenSaleInstance.tokenContract()
        }).then((address) => {
            assert.notEqual(address, 0x0, 'tokenContract has a valid address')
            return tokenSaleInstance.tokenPrice()
        }).then((price) => {
            assert.equal(price.toNumber(), tokenPrice, 'tokenPrice is assigned 0.001 ether')
        })
    })

    it("facilitates buying tokens", () => {
        return StarkToken.deployed().then((instance) => {
            tokenInstance = instance;
            return StarkTokenSale.deployed().then((instance) => {
                tokenSaleInstance = instance;
            })
        }).then((receipt) => {
            tokenInstance.transfer(tokenSaleInstance.address, numberOfTokens, {from: admin})
            return tokenInstance.balanceOf(tokenSaleInstance.address)
        }).then((balance) => {
            assert.equal(balance.toNumber(), numberOfTokens, 'token sale contract has 75% of total token supply')
            return tokenSaleInstance.buyToken(20, {from: buyer, value: 1})
        }).then(assert.fail).catch((error) => {
            assert(error.message.indexOf('revert') >= 0, 'invalid ether value')
            return tokenSaleInstance.buyToken(100, {from: buyer, value: 100 * tokenPrice})
        }).then((receipt) => {
            assert.equal(receipt.logs.length, 1, 'triggers one event')
            assert.equal(receipt.logs[0].event, 'Sell', 'sell event is triggered')
            assert.equal(receipt.logs[0].args._buyer, buyer, 'buyer account is logged')
            assert.equal(receipt.logs[0].args._amount.toNumber(), 100, 'value is logged')
            return tokenSaleInstance.tokensSold()
        }).then((soldTokens) => {
            assert.equal(soldTokens.toNumber(), 100, 'sold tokens is updated')
            return tokenInstance.balanceOf(tokenSaleInstance.address)
        }).then((balance) => {
            assert.equal(balance.toNumber(), numberOfTokens - 100, 'tokens in contract is deducted')
            return tokenInstance.balanceOf(buyer)
        }).then((balance) => {
            assert.equal(balance.toNumber(), 100, 'tokens in buyer account is increased')
        })
    })

    it('ends the token sale', () => {
        return StarkToken.deployed().then((instance) => {
            tokenInstance = instance;
            return StarkTokenSale.deployed()
        }).then((instance) => {
            tokenSaleInstance = instance;
            return tokenSaleInstance.endSale({from: buyer})
        }).then(assert.fail).catch((error) => {
            assert(error.message.indexOf('revert') >= 0, 'only admin can end sale')
            return tokenSaleInstance.endSale({from: admin})
        }).then((receipt) => {
            return tokenInstance.balanceOf(admin)
        }).then((balance) => {
            assert.equal(balance.toNumber(), 250000 + (numberOfTokens - 100), 'balance is returned to admin')
            return tokenSaleInstance.tokenPrice()
        }).then((price) => {
            assert.equal(price.toNumber(), 0, 'contract is self destructed')
        })
    })

})