var StarkToken = artifacts.require('./StarkToken.sol');

contract(StarkToken, (accounts) => {

    var tokenInstance;

    it("contract initialized with correct values", async() => {
        tokenInstance = await StarkToken.deployed();
        var name = await tokenInstance.name()
        var symbol = await tokenInstance.symbol()
        var standard = await tokenInstance.standard()

        assert.equal(name, "Stark Token", "token name is initialized to Stark Token")
        assert.equal(symbol, "STRK", "token symbol is initialized to STRK")
        assert.equal(standard, "Stark Token v1.0", "token standard is initialized to Stark Token v1.0")
    })

    it("contract created with correct supply of tokens", async () => {
        tokenInstance = await StarkToken.deployed();
        var totalSupply = await tokenInstance.totalSupply()
        var balanceOf = await tokenInstance.balanceOf(accounts[0])

        assert.equal(balanceOf.toNumber(), 1000000, "total supply is assigned to the admin acccount")
        assert.equal(totalSupply.toNumber(), 1000000, "total supply is equal to 1000000")
    })

    it("transfers token ownership", () => {
        return StarkToken.deployed().then((instance) => {
            tokenInstance = instance
            return tokenInstance.transfer.call(accounts[1], 2000000);
        }).then(assert.fail).catch((error) => {
            // assert.equal(error.message, "Returned error: VM Exception while processing transaction: revert insufficient balance", 'error message must contain revert');
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
            return tokenInstance.transfer.call(accounts[1], 250000, {from: accounts[0]})
        }).then((success) => {
            assert.equal(success, true, 'it returns true')
            return tokenInstance.transfer(accounts[1], 250000, {from: accounts[0]})
        }).then((receipt) => {
            assert.equal(receipt.logs.length, 1, 'triggers one event')
            assert.equal(receipt.logs[0].event, 'Transfer', 'transfer event is triggered')
            assert.equal(receipt.logs[0].args._from, accounts[0], 'from account is logged')
            assert.equal(receipt.logs[0].args._to, accounts[1], 'to account is logged')
            assert.equal(receipt.logs[0].args._value, 250000, 'value is logged')
            return tokenInstance.balanceOf(accounts[0])
        }).then((balance) => {
            assert.equal(balance.toNumber(), 750000, 'from account balance is reduced')
            return tokenInstance.balanceOf(accounts[1])
        }).then((balance) => {
            assert.equal(balance.toNumber(), 250000, 'to account balance is increased')
        })
    })

    it("allowance is working properly", async() => {
        tokenInstance = await StarkToken.deployed();
        var receipt = await tokenInstance.approve(accounts[1], 100, {from: accounts[0]})

        var allowance = await tokenInstance.allowance(accounts[0], accounts[1])

        assert.equal(allowance.toNumber(), 100, "allowance set to 100 tokens")

        assert.equal(receipt.logs.length, 1, 'triggers one event')
        assert.equal(receipt.logs[0].event, 'Approval', 'approve event is triggered')
        assert.equal(receipt.logs[0].args._owner, accounts[0], 'owner account is logged')
        assert.equal(receipt.logs[0].args._spender, accounts[1], 'spender account is logged')
        assert.equal(receipt.logs[0].args._value, 100, 'value is logged')

        var success = await tokenInstance.approve.call(accounts[1], 100, {from: accounts[0]})

        assert.equal(success, true, 'it returns true')
    })

    it("delegated transfer is working properly", () => {

        var fromAccount = accounts[2];
        var spendingAccount = accounts[3];
        var toAccount = accounts[4];

        return StarkToken.deployed().then((instance) => {
            tokenInstance = instance;

            return tokenInstance.transfer(fromAccount, 100, {from: accounts[0]})
        }).then(async(receipt) => {
            return tokenInstance.balanceOf(fromAccount)
        }).then((balance) => {
            assert.equal(balance.toNumber(), 100, "owner account balance is 100")
            return tokenInstance.approve(spendingAccount, 10, {from: fromAccount})
        })
        .then((receipt) => {
            return tokenInstance.transferFrom(fromAccount, toAccount, 2000, {from: spendingAccount})
        }).then(assert.fail).catch((error) => {
            assert(error.message.indexOf('revert') >= 0, "insufficient owner account balance")
            return tokenInstance.transferFrom(fromAccount, toAccount, 20, {from: spendingAccount})
        }).then(assert.fail).catch((error) => {
            assert(error.message.indexOf('revert') >= 0, "insufficient allowance balance")
            return tokenInstance.transferFrom.call(fromAccount, toAccount, 10, {from: spendingAccount})
        }).then((success) => {
            assert.equal(success, true, "return value is true")
            return tokenInstance.transferFrom(fromAccount, toAccount, 10, {from: spendingAccount})
        }).then(async(receipt) => {
            assert.equal(receipt.logs.length, 1, 'triggers one event')
            assert.equal(receipt.logs[0].event, 'Transfer', 'transfer event is triggered')
            assert.equal(receipt.logs[0].args._from, fromAccount, 'from account is logged')
            assert.equal(receipt.logs[0].args._to, toAccount, 'to account is logged')
            assert.equal(receipt.logs[0].args._value.toNumber(), 10, 'value is logged')

            return tokenInstance.balanceOf(fromAccount)

        }).then((balance) => {
            assert.equal(balance.toNumber(), 90, 'owner account balance is decreased')

            return tokenInstance.balanceOf(toAccount)
        }).then((balance) => {
            assert.equal(balance.toNumber(), 10, 'to account balance is increased')

            return tokenInstance.allowance(fromAccount, spendingAccount)
        }).then((balance) => {
            assert.equal(balance.toNumber(), 0, 'spending account allowance is reduced')
        })
    })

})