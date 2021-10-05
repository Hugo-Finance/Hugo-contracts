//SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

/**
 * @author SabaunT https://github.com/SabaunT.
 * @dev Types used by HugoNFT project contracts
 */
contract HugoNFTTypes {
    struct Trait {
        uint256 attributeId;
        uint256 traitId;
        string name;
    }

    struct Script {
        string script;
        bool isValid;
    }

    struct NFT {
        uint256 tokenId;
        string name;
        string description;
        // Seed is an array of trait ids. A 0 value of token id is reserved
        // for "no attribute" in the seed array.
        uint256[] seed;
        string cid;
        // index in _tokenIdsOfAddress[ownerOfNFT] array
        uint256 index;
    }

    struct Attribute {
        uint256 attributeId;
        string name;
    }
}