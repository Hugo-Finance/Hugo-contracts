//SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./HugoNFTTypes.sol";

/**
 * @author SabaunT https://github.com/SabaunT.
 * @notice There is a defined order of values of seed, CIDs, and such arrays,
 * which is defined in constructor. See: https://github.com/SabaunT/hugo-nft/blob/master/contracts/HugoNFT.sol#L57-L75.
 * It means, that if attribute names were defined in constructor in the next order
 * ["head", "glasses", "body", "shirt", "scarf"], then the first number in seed array
 * is a trait id of the head attribute. The second number in the CIDs array is a CID
 * for glasses attribute.
 */
contract HugoNFTStorage is HugoNFTTypes {
    // Available to mint amount of auto-generated NFTs.
    uint256 public constant generatedHugoCap = 10000;

    // Performs minting operations (minting exclusive or generative NFTs)
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    // Performs NFTs meta-data management (managing attributes, traits, CIDs and such)
    bytes32 public constant NFT_ADMIN_ROLE = keccak256("NFT_ADMIN_ROLE");

    // Length of the CID in base58 representation
    uint256 internal constant IPFS_CID_BYTES_LENGTH = 46;
    // Maximum adding at once
    uint256 internal constant MAX_ADDING_TRAITS = 30;

    // Total NFTs minted
    uint256 public totalSupply;

    // Amount of exclusive NFTs minted
    uint256 public exclusiveNFTsAmount;

    // Current (actual) amount of attributes used to generate NFT
    uint256 public currentAttributesAmount;

    string internal _baseTokenURI;

    // Min amount of attributes that an NFT should have.
    // Defined by initial value of `currentAttributesAmount`,
    // which is set in constructor.
    uint256 public minAttributesAmount;

    // Script that is used to generate NFTs from traits.
    // Each time we add a new attribute, script should be updated to
    // apply a new version of NFTs with a different amount of attributes.
    string[] internal nftGenerationScripts;

    // attribute id => attribute struct
    // todo discuss getting attrs by name: https://ethereum.stackexchange.com/questions/82854/function-to-check-string-is-only-formed-by-lowercase-letters
    mapping(uint256 => Attribute) internal _attributes;

    // address => token ids of the address
    // *NOTE*: no order is guaranteed.
    mapping(address => uint256[]) internal _tokenIdsOfAccount;

    // token id => generated hugo.
    mapping(uint256 => NFT) internal _NFTs;

    // keccak256 of seed => boolean. Shows whether seed was used or not.
    mapping(bytes32 => bool) internal _isUsedSeed;

    // attribute id => traits of the attribute
    mapping(uint256 => Trait[]) internal _traitsOfAttribute;

    // attribute id => ipfs cid of the folder, where traits are stored
    mapping(uint256 => string[]) internal _CIDsOfAttribute;
}
