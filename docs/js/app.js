var App = {

    contracts : {},
    address: '0x0',
    tokenPrice: 0,
    tokensSold : 0,
    totalTokens : 750000,

    init : () => {
        console.log('App initialized...')
        return App.initWeb3()
    },

    initWeb3: async() => {
        // Modern dapp browsers...
        if (window.ethereum) {
            Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
            window.web3 = new Web3(ethereum);
            try {
                // Request account access if needed
                await ethereum.enable();
                // Acccounts now exposed
                console.log("Success")
            } catch (error) {
                // User denied account access...
                console.log(error)
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            window.web3 = new Web3(web3.currentProvider);
            console.log("Connected to Metamask..")
        }
        // Non-dapp browsers...
        else {
            console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
            web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
        }

        return App.initContract()

    },

    initContract: () => {
        $.getJSON('StarkTokenSale.json', (tokenSaleContract) => {
            App.contracts.tokenSaleContract = TruffleContract(tokenSaleContract)
            App.contracts.tokenSaleContract.setProvider(web3.currentProvider)
            App.contracts.tokenSaleContract.deployed().then((instance) => {
                console.log("StarkTokenSale Address: ", instance.address)
            })

            $.getJSON('StarkToken.json', (tokenContract) => {
                App.contracts.tokenContract = TruffleContract(tokenContract)
                App.contracts.tokenContract.setProvider(web3.currentProvider)
                App.contracts.tokenContract.deployed().then((instance) => {
                    console.log("StarkToken Address: ", instance.address)
                })
                
                // App.listenForEvents()
                return App.render()
    
            })
        })

    },

    // listenForEvents: () => {
    //     console.log('listening..')
    //     App.contracts.tokenSaleContract.deployed().then((instance) => {
    //         console.log(instance.events)
    //         instance.events.Sell({
    //             fromBlock: 0,
    //             toBlock: 'latest'
    //         }, (error, event) => {
    //             console.log("Event trigerred", event)
    //             App.render()
    //         })
    //     })
    // },


    render: async() => {

        var tokenInstance;
        var tokenSaleInstance;

        web3.eth.getCoinbase((err, account) => {
            if(!err) {
                App.address = account
                document.getElementById('address').innerText = "Your Address: " + account
            }
        })

        tokenInstance = await App.contracts.tokenContract.deployed()
        tokenSaleInstance = await App.contracts.tokenSaleContract.deployed()

        var ownedTokens = await tokenInstance.balanceOf(App.address)
        document.getElementById('ownedTokens').innerText = ownedTokens.toNumber()

        var price = await tokenSaleInstance.tokenPrice()
        App.tokenPrice = price
        document.getElementById('price').innerText = web3.fromWei(price, 'ether')

        App.tokensSold = await tokenSaleInstance.tokensSold()
        document.getElementById('tokensSold').innerText = App.tokensSold.toNumber()
        document.getElementById('totalTokens').innerText = App.totalTokens

        var progress = (App.tokensSold / App.totalTokens) * 100
        document.getElementById('progress-bar').style.width = progress + '%'

        document.getElementById('loader').style.display = "none"
        document.getElementById('content').style.display = "block"
    },

    buyToken: () => {

        var tokenInstance;
        var tokenSaleInstance;

        var numberOfTokens = document.getElementById('numberOfTokens').value

        App.contracts.tokenSaleContract.deployed().then((instance) => {
            tokenSaleInstance = instance
            return tokenSaleInstance.buyToken(numberOfTokens, {
                from: App.address,
                value: numberOfTokens * App.tokenPrice,
                gas: 500000
            })
        }).then((receipt) => {
            document.getElementById('numberOfTokens').value = 1
            App.render()
        })

    }
}

window.addEventListener('load', () => {
    App.init()
})