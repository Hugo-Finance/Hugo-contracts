//SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "./HugoNFTAbstractImpl.sol";

abstract contract HugoNFTMinter is ERC721, HugoNFTAbstractImpl {
    event Mint(address indexed to, uint256 indexed tokenId, string name, string description);
    event ChangeName(uint256 indexed tokenId, string name);
    event ChangeDescription(uint256 indexed tokenId, string description);

    /**
     * @dev Mints a new auto-generative NFT with a seed for a `to` address.
     *
     * Seed is a an array of traits (more precisely, trait ids) for each attribute
     * of the NFT. The function is intended to be called by an NFT shop or owner
     * for a give away program.
     *
     * Concerning seed validation and requirements for it inner structure, see https://github.com/SabaunT/hugo-nft/blob/master/contracts/HugoNFTStorage.sol#L8-L13
     * and {HugoNFTMinter-_isValidSeed} with {HugoNFTMinter-_isNewSeed}.
     *
     * Returns id of the newly generated NFT.
     *
     * Requirements:
     * - `msg.sender` should have {HugoNFTStorage-MINTER_ROLE}
     * - `seed` should be valid
     * - `name` and `description` must fit bytes length requirements
     */
    function mint(
        address to,
        uint256[] calldata seed,
        string calldata name,
        string calldata description
    )
        external
        override(AbstractHugoNFT)
        onlyRole(MINTER_ROLE)
        returns (uint256 newTokenId)
    {
        require(
            _getGeneratedHugoAmount() < generatedHugoCap,
            "HugoNFT::supply cap was reached"
        );
        require(_isValidSeed(seed), "HugoNFT::seed is invalid");
        // not to call twice
        bytes32 seedHash = _getSeedHash(seed);
        require(_isNewSeed(seedHash), "HugoNFT::seed is used");
        require(
            bytes(name).length > 0 && bytes(name).length <= 75,
            "HugoNFT::invalid NFT name length"
        );
        require(
            bytes(description).length > 0 && bytes(description).length <= 300,
            "HugoNFT::invalid NFT description length"
        );

        newTokenId = _getNewIdForGeneratedHugo();
        super._safeMint(to, newTokenId);

        totalSupply += 1;

        uint256[] storage tIdsOfA = _tokenIdsOfAccount[to];
        uint256 idInArrayOfIds = tIdsOfA.length;

        tIdsOfA.push(newTokenId);
        _NFTs[newTokenId] = NFT(newTokenId, name, description, seed, "", idInArrayOfIds);
        _isUsedSeed[seedHash] = true;

        emit Mint(to, newTokenId, name, description);

        return newTokenId;
    }

    /**
     * @dev Mints a new exclusive NFT for a `to` address.
     *
     * Mints an exclusive NFT, whose IPFS CID is defined under `cid` string.
     * Doesn't require any seeds.
     *
     * Returns id of the newly generated NFT.
     *
     * Requirements:
     * - `msg.sender` should have {HugoNFTStorage-MINTER_ROLE}
     * - `cid` should have length equal to {HugoNFTStorage-IPFS_CID_BYTES_LENGTH}
     * - `name` and `description` must fit bytes length requirements
     */
    function mintExclusive(
        address to,
        string calldata name,
        string calldata description,
        string calldata cid
    )
        external
        override(AbstractHugoNFT)
        onlyRole(MINTER_ROLE)
        returns (uint256 newTokenId)
    {
        require(
            bytes(name).length > 0 && bytes(name).length <= 75,
            "HugoNFT::invalid NFT name length"
        );
        require(
            bytes(description).length > 0 && bytes(description).length <= 300,
            "HugoNFT::invalid NFT description length"
        );
        require(
            bytes(cid).length == IPFS_CID_BYTES_LENGTH,
            "HugoNFT::invalid ipfs CID length"
        );

        newTokenId = _getNewIdForExclusiveHugo();
        super._safeMint(to, newTokenId);

        totalSupply += 1;
        exclusiveNFTsAmount += 1;

        uint256[] storage tIdsOfA = _tokenIdsOfAccount[to];
        uint256 idInArrayOfIds = tIdsOfA.length;

        tIdsOfA.push(newTokenId);
        _NFTs[newTokenId] = NFT(newTokenId, name, description, new uint256[](0), cid, idInArrayOfIds);

        emit Mint(to, newTokenId, name, description);

        return newTokenId;
    }

    /**
     * @dev Changes name of the NFT with provided tokenId.
     *
     * Requirements:
     * - `msg.sender` should have {HugoNFTStorage-NFT_ADMIN} role
     * - `tokenId` should be an Id of existing NFT
     * - `name` shouldn't be empty or larger than 75 bytes
     */
    function changeNFTName(uint256 tokenId, string calldata name)
        external
        override(AbstractHugoNFT)
        onlyRole(NFT_ADMIN_ROLE)
    {
        require(_tokenExists(tokenId), "HugoNFT::nft with such id doesn't exist");
        require(
            bytes(name).length > 0 && bytes(name).length <= 75,
            "HugoNFT::invalid NFT name length"
        );

        _NFTs[tokenId].name = name;

        emit ChangeName(tokenId, name);
    }

    /**
     * @dev Changes description of the NFT with provided tokenId.
     *
     * Requirements:
     * - `msg.sender` should have {HugoNFTStorage-NFT_ADMIN} role
     * - `tokenId` should be an Id of existing NFT
     * - `description` shouldn't be empty or larger than 300 bytes
     */
    function changeNFTDescription(uint256 tokenId, string calldata description)
        external
        override(AbstractHugoNFT)
        onlyRole(NFT_ADMIN_ROLE)
    {
        require(_tokenExists(tokenId), "HugoNFT::nft with such id doesn't exist");
        require(
            bytes(description).length > 0 && bytes(description).length <= 300,
            "HugoNFT::invalid NFT description length"
        );

        _NFTs[tokenId].description = description;

        emit ChangeDescription(tokenId, description);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(HugoNFTAbstractImpl, ERC721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Hook that is called before any token transfer. This includes minting
     * and burning.
     *
     * Calling conditions:
     *
     * - When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
     * transferred to `to`.
     * - When `from` is zero, `tokenId` will be minted for `to`.
     * - When `to` is zero, ``from``'s `tokenId` will be burned.
     * - `from` and `to` are never both zero.
     *
     * Current implementation focuses only on transfers. If it's a transfer, we only
     * have to check `from != address(0)`, because the check in {ERC721-_transfer}
     * guarantees `to != address(0)`.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        // Does nothing as ERC721._beforeTokenTransfer has no logic
        super._beforeTokenTransfer(from, to, tokenId);

        // transferFrom was called
        if (from != address(0)) {
            uint256[] storage tokenIdsOfFrom = _tokenIdsOfAccount[from];
            uint256[] storage tokenIdsOfTo = _tokenIdsOfAccount[to];
            NFT storage transferringNFT = _NFTs[tokenId];

            uint256 lastIndexInIdsFrom = tokenIdsOfFrom.length - 1;
            uint256 transferringTokenIndex = transferringNFT.index;

            if (transferringTokenIndex != lastIndexInIdsFrom) {
                uint256 lastIdFrom = tokenIdsOfFrom[lastIndexInIdsFrom];
                NFT storage lastNFTFrom = _NFTs[lastIdFrom];

                tokenIdsOfFrom[transferringTokenIndex] = lastIdFrom;
                lastNFTFrom.index = transferringTokenIndex;
            }

            uint256 transferringTokenNewIndex = tokenIdsOfTo.length;
            tokenIdsOfTo.push(tokenId);
            transferringNFT.index = transferringTokenNewIndex;

            tokenIdsOfFrom.pop();
        }
    }

    /**
     * @dev Computes and returns the hash of the seed
     *
     * First converts seed to `bytes memory` array by getting each trait id from seed,
     * converting it to bytes32 and putting these bytes into in seed bytes representation.
     * Then hashes the bytes representation using keccak256.
     *
     * *Note*: Should be called only on valid seeds!
     * *Note*: The input seed has its right trailing zeroes in it truncated before hashing.
     *
     * For example, we have `minAttributesAmount` equal to 3. Then:
     * 1. _getSeedHash([1,2,3,0,0]) == _getSeedHash([1,2,3])
     * 2. _getSeedHash([1,2,3,0,1]) == _getSeedHash([1,2,3,0,1]) != _getSeedHash([1,2,3,1])
     *
     * Returns a bytes32 result of calling keccak256 on the input seed.
     */
    function _getSeedHash(uint256[] calldata validSeed) internal view returns (bytes32) {
        uint256[] memory validSeedNoTrailingZeroes = _getWithoutTrailingZeroes(validSeed);
        bytes memory seedBytes = new bytes(32 * validSeedNoTrailingZeroes.length);
        for (uint256 i = 0; i < validSeedNoTrailingZeroes.length; i++) {
            uint256 traitId = validSeedNoTrailingZeroes[i];
            seedBytes = bytes.concat(seedBytes, bytes32(traitId));
        }
        return keccak256(seedBytes);
    }

    // todo discuss error return
    /**
     * @dev Checks whether input seed is valid
     *
     * Seed is an array of trait ids of attributes, used to generate NFT.
     * Input seed length shouldn't be less than `minAttributesAmount` and more than
     * `currentAttributesAmount`. Also trait ids inside seed shouldn't be valid, i.e.
     * 1) they should exist in attribute's trait array and 2) shouldn't be 0 for core
     * attributes. Core attributes are those, which were added during deployment, so
     * their ids are < `minAttributesAmount`.
     *
     * Returns true if seed is valid, otherwise - false.
     */
    function _isValidSeed(uint256[] calldata seed) internal view returns (bool) {
        if (seed.length > currentAttributesAmount || seed.length < minAttributesAmount) {
            return false;
        }
        return _areValidTraitIds(seed);
    }

    function _isIdOfGeneratedNFT(uint256 tokenId) internal pure returns (bool) {
        return tokenId < generatedHugoCap;
    }

    /**
     * @dev Checks whether token exists
     *
     * If token doesn't exist it will have zero length seed and zero length CID.
     * Otherwise token will have either seed length being not equal to 0,
     * or CID length being equal to {HugoNFTStorage-IPFS_CID_BYTES_LENGTH}.
     *
     * We could define such check for seed: `nft.seed.length >= minAttributesAmount`, but
     * if constructor changes, then we can have a risk of this check becoming invalid. For example,
     * if we get rid of setting value to {HugoNFTStorage-minAttributesAmount} in constructor during,
     * say, refactoring, this check will be invalid.
     *
     * Return true if token with `tokenId` exists, otherwise returns false.
     */
    function _tokenExists(uint256 tokenId) internal view returns (bool) {
        NFT storage nft = _NFTs[tokenId];
        return nft.seed.length != 0 || bytes(nft.cid).length == IPFS_CID_BYTES_LENGTH;
    }

    function _getGeneratedHugoAmount() internal view returns (uint256) {
        return totalSupply - exclusiveNFTsAmount;
    }

    /**
     * @dev Checks whether seed trait ids are valid
     *
     * Length of the seed isn't checked, because it should be done
     * before calling the function (in {HugoNFTMinter-_isValidSeed}).
     * For more info see {HugoNFTMinter-_isValidSeed}.
     *
     * Returns true if trait ids are valid, otherwise - false
     */
    function _areValidTraitIds(uint256[] calldata seed) private view returns (bool) {
        for (uint256 i = 0; i < seed.length; i++ ) {
            // That's one of reasons why traits are added sequentially.
            // If IDs weren't provided sequentially, the only check we could do is
            // by accessing a trait in some mapping, that stores info whether the trait
            // with the provided id is present or not.
            uint256 maxTraitIdInAttribute = _traitsOfAttribute[i].length;
            // Trait ids start from 1 and are defined in a sequential order.
            // Zero trait id is possible - it means that generating NFT won't have
            // such attribute. But it's possible only for those attributes, which were
            // added after deployment, i.e. whose ids >= `minAttributesAmount`
            if ((i < minAttributesAmount && seed[i] == 0) || seed[i] > maxTraitIdInAttribute) {
                return false;
            }
        }
        return true;
    }

    // Just for convenience and readability
    function _isNewSeed(bytes32 seed) private view returns (bool) {
        return !_isUsedSeed[seed];
    }

    /**
     * @dev Gets token id to mint a new auto-generative NFT
     *
     * For this type of NFTs ids are defined from 0 to 9999.
     * All in all, 10'000 generated hugo NFTs.
     *
     * Returns a uint256 id number for a new auto-generative NFT
     */
    function _getNewIdForGeneratedHugo() private view returns (uint256) {
        return _getGeneratedHugoAmount();
    }

    /**
     * @dev Gets token id to mint a new exclusive (not generated) NFT
     *
     * For this type of NFTs ids are defined from 10'000 and e.t.c.
     * There is no cap for such NFTs.
     *
     * Returns a uint256 id number for a new exclusive NFT
     */
    function _getNewIdForExclusiveHugo() private view returns (uint256) {
        return generatedHugoCap + exclusiveNFTsAmount;
    }

    /**
     * @dev Gets rid of trailing zeroes in valid seed array.
     *
     * Does not modify input data. It iterates through trait ids from the back,
     * adjusting the `end` index, from which all the trait ids of the input seed are 0.
     * When a non-zero values occurs, breaks the loop and returns `validSeed[:end]`
     *
     * Returns an array of seeds without trailing zeroes (from the right)
     */
    function _getWithoutTrailingZeroes(uint256[] calldata validSeed)
        private
        view
        returns
        (uint256[] memory)
    {
        uint256 end = validSeed.length;
        for (uint256 i = validSeed.length - 1; i >= minAttributesAmount; i--) {
            if (validSeed[i] != 0) { break ;}
            end = i;
        }
        return validSeed[:end];
    }
}