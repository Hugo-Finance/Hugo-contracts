// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


interface INFT {
    struct Trait {
        uint256 attributeId;
        uint256 traitId;
        string name;
    }
    function minAttributesAmount() external view returns (uint256);
    function generatedNFTsAmount() external view returns (uint256);
    function isUsedSeed(uint256[] calldata seed) external view returns (bool);
    function getTraitsOfAttribute(uint256 attributeId) external view returns (Trait[] memory);
    function mint(
        address to,
        uint256[] calldata seed,
        string calldata name,
        string calldata description
    )
    external returns (uint256 newTokenId);
}
