// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

contract Target {
    uint public state = 0;

    function set(uint state_) public {
        state = state_;
    }
}
