const HugoNFT = artifacts.require('HugoNFT');
const HugoNest = artifacts.require("HugoNest");
const { constants } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const ATTRIBUTE_NAMES = ["background", "body", "clothing", "accessories", "headwear", "glasses"];

const IncubatorLvl = {
    NONE: 0,
    LVL_0: 1,
    LVL_1: 2,
    LVL_2: 3,
    LVL_3: 4
}

const ConsumableLvl = {
    NONE: 0,
    LVL_1: 1,
    LVL_2: 2,
    LVL_3: 3
}

const CIDs = [
    "QmZdAJvK1onmhNkiPRbouLcFSCXqMUXeakkNeuqThCxbrd",
    "QmWqSckcJzbTsMziCGkKt8xNftKEb2hrMsDWS6hwH3F5Z5",
    "QmVnQ5yqj2WuR7u61k41SLCCQurBp3UxW6Sgm3MxAsKgup",
    "QmcCm8kcaZVBCMC2rWoqaymCR6iKHKbhyL88qLzQcdGfpt",
    "QmYyzY4FNCTE4hsPcP7LsLutD3Rw2jgJR9DpwbiJL1Jvgk",
    "QmSBGG6LaW4SCiiaRq9k1QdQJ9H5eDwZUHxEe1LFM5LrB9"
]
const TRAIT_NUMS = [12, 15, 29, 9, 27, 9];

const EGGS_PRICES = [150, 35, 35, 120, 200, 70, 200, 150, 35, 35, 35, 120, 200, 35, 120];
const HUGO_EGG_DISCOUNT = 900;

const HUGO_PRICE = 0.1;
const WBNB_PRICE = 400;
const HUGO_DECIMALS = 10**9;
const WBNB_DECIMALS = 10**18;

const VAULT_LVL_1 = 50000;
const VAULT_LVL_2 = 100000;
const VAULT_LVL_3 = 250000;

const VAULT_RELOAD_TIME = 5 * 24 * 60 * 60;

const constructorParams = {
    baseURI: "your base uri",
    initialAmountOfAttributes: ATTRIBUTE_NAMES.length,
    generationScript: "some py script",
    traitAmountForEachAttribute: TRAIT_NUMS,
    // [["head0", "head1", "head2"], ["glasses0", ...], ...]
    traitNamesForEachAttribute: TRAIT_NUMS.map((e, i) => Array(e).fill(i.toString())),
    CIDsForEachAttribute: CIDs,
    attributesNames: ATTRIBUTE_NAMES,
};
const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";

async function deployNFT() {
    return await HugoNFT.new(
        constructorParams.baseURI,
        constructorParams.initialAmountOfAttributes,
        constructorParams.generationScript,
        constructorParams.traitAmountForEachAttribute,
        constructorParams.traitNamesForEachAttribute,
        constructorParams.CIDsForEachAttribute,
        constructorParams.attributesNames,
        {gas: 25000000}
    )
}

async function deployNest(hugo, nft, pancake, beneficiary, owner) {
    const nest = await HugoNest.new();
    await nest.initialize(owner, hugo, nft, beneficiary, pancake, EGGS_PRICES, ZERO_ADDRESS, ZERO_ADDRESS, HUGO_EGG_DISCOUNT);
    return nest;
}

module.exports = {
    deployNFT,
    deployNest,
    MINTER_ROLE,
    EGGS_PRICES,
    HUGO_EGG_DISCOUNT,
    TRAIT_NUMS,
    HUGO_PRICE,
    WBNB_PRICE,
    HUGO_DECIMALS,
    WBNB_DECIMALS,
    IncubatorLvl,
    ConsumableLvl,
    VAULT_LVL_1,
    VAULT_LVL_2,
    VAULT_LVL_3,
    VAULT_RELOAD_TIME
}