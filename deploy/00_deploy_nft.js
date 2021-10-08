const names = require('./../consts/names.json');

// testnet
const ATTRIBUTE_NAMES = ["Background", "Body", "Clothing", "Accessories", "Headwear", "Glasses"];
const CIDs = [
    'QmUhYDDxAJ23GYPimNoqR487tSLYG5C2Bn3B9XiPq3jP3o',
    'QmWqSckcJzbTsMziCGkKt8xNftKEb2hrMsDWS6hwH3F5Z5',
    'QmVjoqYb8hfqvHeNVms34CGZZ17k8apU245xmdAD2HEWY8',
    'QmbSoUARHT4gNzcj2c4hm3CuaNTQvZNYGfoLJzgagnRDaE',
    'QmVF3gWPk1Lf7T2c5ndrvWsbBDn7fCDNU9r6B8d8Xp1SiM',
    'QmTGQRfhV1uvC65Dphw2MJ9sQ4uxraXXescnnxgq6j1JEr'
]
const TRAITS_NAMES = ATTRIBUTE_NAMES.map((attr_name) => {
    const sorted_keys = Object.keys(names[attr_name]).sort((a, b) => Number(a) < Number(b));
    return sorted_keys.map((key) => names[attr_name][key])
})

const TRAIT_NUMS = [12, 15, 29, 26, 27, 15];
const constructorParams = {
    baseURI: "https://app.hugo.finance/api/nft/",
    initialAmountOfAttributes: ATTRIBUTE_NAMES.length,
    generationScript: "some py script",
    traitAmountForEachAttribute: TRAIT_NUMS,
    traitNamesForEachAttribute: TRAITS_NAMES,
    CIDsForEachAttribute: CIDs,
    attributesNames: ATTRIBUTE_NAMES,
};

module.exports = async ({
    getNamedAccounts,
    deployments
}) => {
    const {deployer} = await getNamedAccounts();

    await deployments.deploy('HugoNFT', {
        from: deployer,
        log: true,
        args: [
            constructorParams.baseURI,
            constructorParams.initialAmountOfAttributes,
            constructorParams.generationScript,
            constructorParams.traitAmountForEachAttribute,
            constructorParams.traitNamesForEachAttribute,
            constructorParams.CIDsForEachAttribute,
            constructorParams.attributesNames
        ]
    });
};
module.exports.tags = ['NFT'];
