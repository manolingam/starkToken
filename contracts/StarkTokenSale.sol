pragma solidity ^0.5.0;

import './StarkToken.sol';

contract StarkTokenSale {

    address payable admin;
    StarkToken public tokenContract;
    uint256 public tokenPrice;
    uint256 public tokensSold;

    event Sell(
        address _buyer,
        uint _amount
    );

    constructor (StarkToken _tokenContract, uint256 _tokenPrice) public {
        admin = msg.sender;
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
    }

    function multiply(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x, '');
    }

    function buyToken(uint256 _numberOfTokens) public payable {
        require(msg.value == multiply(_numberOfTokens, tokenPrice), 'invalid amount of ether sent');
        require(tokenContract.balanceOf(address(this)) >= _numberOfTokens, 'insufficient balance in contract');
        require(tokenContract.transfer(msg.sender, _numberOfTokens), '');

        tokensSold += _numberOfTokens;

        emit Sell(msg.sender, _numberOfTokens);
    }

    function endSale() public {
        require(msg.sender == admin, 'only admin can end sale');
        require(tokenContract.transfer(admin, tokenContract.balanceOf(address(this))), 'could not transfer tokens');

        selfdestruct(admin);
    }

}