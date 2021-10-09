// testnet
const test = {
    HUGO_ADDR: '0x434f288ff599e1f56fe27cf372be2941543b4171',
    PANCAKE: '0x87a07f7B90E2b582535668237fd5e2A2f6A89B53',
    BENEFICIARY: '0x197216E3421D13A72Fdd79A44d8d89f121dcab6C',
    prices: [150, 35, 35, 120, 200, 70, 200, 150, 35, 35, 35, 120, 200, 35, 120],
    WBNB: '0x197216E3421D13A72Fdd79A44d8d89f121dcab6C', // doesnt matter for test
    BUSD: '0x197216E3421D13A72Fdd79A44d8d89f121dcab6C', // doesnt matter for test
    owner: '0x197216E3421D13A72Fdd79A44d8d89f121dcab6C'
}

const main = {
    HUGO_ADDR: '0xCE195c777e1ce96C30ebeC54C91d20417a068706',
    PANCAKE: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    BENEFICIARY: '0x746EF8b82f14EcC8f0357d4B384c2a449dcE1274',
    prices: [150, 35, 35, 120, 200, 70, 200, 150, 35, 35, 35, 120, 200, 35, 120],
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    owner: '0x197216E3421D13A72Fdd79A44d8d89f121dcab6C'
}


const hugo_egg_discount = 900;

module.exports = async ({
    getNamedAccounts,
    deployments,
    getChainId
}) => {
    const {deployer} = await getNamedAccounts();
    const nft = await deployments.get('HugoNFT');
    const chain_id = await getChainId();
    let params = main;
    let contract = 'HugoNest';
    if (chain_id.toString() === '97') {
        contract = 'TestHugoNest';
        params = test;
    }

    console.log('Using contract -', contract);
    console.log('Deploy params:');
    console.dir(params);

    const nest = await deployments.deploy(contract, {
        from: deployer,
        log: true,
        gasLimit: 20000000,
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
            execute: {
                init: {
                    methodName: 'initialize',
                    args: [params.owner, params.HUGO_ADDR, nft.address, params.BENEFICIARY,
                        params.PANCAKE, params.prices, params.WBNB, params.BUSD, hugo_egg_discount],
                }
            }
        }
    });
    console.log('Nest address', nest.address);
};
module.exports.tags = ['Nest'];
