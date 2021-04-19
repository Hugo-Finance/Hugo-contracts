// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;
pragma experimental ABIEncoderV2;

import "../governance/HugoDao.sol";

contract HugoDao2 is HugoDao {
    function version() external override pure returns(uint8) {
        return 2;
    }
}
