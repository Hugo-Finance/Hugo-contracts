pragma solidity ^0.8.0;

import "../interfaces/IPancake.sol";

contract TestPancake is IPancake {
    function getAmountsIn(uint amountOut, address[] memory path) external view override returns (uint[] memory amounts) {
        // expects path == [hugo, wbnb, busd]
        uint256[] memory _amounts = new uint256[](3);
        _amounts[2] = amountOut;
        _amounts[1] = amountOut / 400; // lets say wbnb = 400$
        _amounts[0] = amountOut * 10; // lets say hugo = 0.1$
        return _amounts;
    }
}
