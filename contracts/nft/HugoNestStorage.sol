pragma solidity ^0.8.2;
pragma experimental ABIEncoderV2;


contract  HugoNestStorage {
    enum IncubatorLevel { NONE, LVL_0, LVL_1, LVL_2, LVL_3 }
    enum ConsumableLevel { NONE, LVL_1, LVL_2, LVL_3 }
    enum VaultLevel { LVL_0, LVL_1, LVL_2, LVL_3 }
    enum CurrencyType { HUGO, BNB }
    enum RewardType { CONSUMABLE, INCUBATOR }
    // ordering is important!!! dont change
    enum NFTPart { BACKGROUND, BODY, CLOTHING, ACCESSORIES, HEADWEAR, GLASSES }

    // hugo nft token
    address public NFT;

    // hugo token
    address public HUGO;

    // address receiver of bnb/hugo tokens from shop
    address public beneficiary;

    // pancakeswap router
    address public Pancake;

    // address of busd token, needed for price calculation on pancake
    address public BUSD;

    // address of wbnb token, needed for price calculation on pancake
    address public WBNB;

    uint256 public eggs_purchased;

    // 1000 means no discount, 10% discount by default
    uint16 public hugo_egg_discount;

    uint16 constant public MAX_DISCOUNT = 1000;

    uint256 constant public MAX_NFT_NUMBER = 10000;

    uint32 constant public LVL3_INCUBATOR = 250000;

    uint32 constant public LVL2_INCUBATOR = 100000;

    uint32 constant public LVL1_INCUBATOR = 50000;

    uint8 constant public INCUBATOR_MAX_USAGES = 5;

    uint32 constant public VAULT_RELOAD_TIME = 5 days;

    // idx + 1 == body trait (all attr traits start from 1)
    uint16[] public eggs_prices_usd;

    struct Egg {
        uint8 body_type;
        // 0 means no incubator is used
        IncubatorLevel incubator_lvl;
        // 0 means no consumable is used
        ConsumableLevel consumable_lvl;
        uint32 ready_at;
    }

    struct Incubator {
        IncubatorLevel lvl;
        uint8 remaining_usages;
    }

    struct UserData {
        // tokens staked in vault
        uint256 vault_staked_tokens;
        // lvl of vault based on staked tokens
        VaultLevel vault_level;
        // time when reward could be obtained from vault
        uint32 vault_reward_at;

        Egg[] eggs;
        // every element is a consumable with value == lvl of consumable
        ConsumableLevel[] consumables;
        Incubator[] incubators;
    }

    mapping(address => UserData) user_data;
}
