// testnet
const ATTRIBUTE_NAMES = ["background", "body", "clothing", "accessories", "headwear", "glasses"];
const CIDs = [
    "QmZdAJvK1onmhNkiPRbouLcFSCXqMUXeakkNeuqThCxbrd",
    "QmWqSckcJzbTsMziCGkKt8xNftKEb2hrMsDWS6hwH3F5Z5",
    "QmVnQ5yqj2WuR7u61k41SLCCQurBp3UxW6Sgm3MxAsKgup",
    "QmcCm8kcaZVBCMC2rWoqaymCR6iKHKbhyL88qLzQcdGfpt",
    "QmYyzY4FNCTE4hsPcP7LsLutD3Rw2jgJR9DpwbiJL1Jvgk",
    "QmSBGG6LaW4SCiiaRq9k1QdQJ9H5eDwZUHxEe1LFM5LrB9"
]
const TRAIT_NUMS = [12, 15, 29, 9, 27, 9];
const constructorParams = {
    baseURI: "your base uri",
    initialAmountOfAttributes: ATTRIBUTE_NAMES.length,
    generationScript: "some py script",
    traitAmountForEachAttribute: TRAIT_NUMS,
    traitNamesForEachAttribute: TRAIT_NUMS.map((e, i) => Array(e).fill(i.toString())),
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
