//SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";

import "./HugoNFTStorage.sol";
import "./AbstractHugoNFT.sol";

abstract contract HugoNFTAbstractImpl is AccessControl, HugoNFTStorage, AbstractHugoNFT {
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
