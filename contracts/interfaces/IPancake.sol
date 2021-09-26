// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


interface IPancake {
    function getAmountsIn(uint amountOut, address[] memory path) external view returns (uint[] memory amounts);
}
