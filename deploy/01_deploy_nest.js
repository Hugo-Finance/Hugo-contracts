// testnet
const HUGO_ADDR = '0x434f288ff599e1f56fe27cf372be2941543b4171';
const PANCAKE = '0x87a07f7B90E2b582535668237fd5e2A2f6A89B53';
const BENEFICIARY = '0x197216E3421D13A72Fdd79A44d8d89f121dcab6C';
const prices = [150, 35, 35, 120, 200, 70, 200, 150, 35, 35, 35, 120, 200, 35, 120];
const WBNB = '0x197216E3421D13A72Fdd79A44d8d89f121dcab6C'; // doesnt matter for test
const BUSD = '0x197216E3421D13A72Fdd79A44d8d89f121dcab6C'; // doesnt matter for test
const owner = '0x197216E3421D13A72Fdd79A44d8d89f121dcab6C';
const hugo_egg_discount = 900;

module.exports = async ({
    getNamedAccounts,
    deployments,
    getChainId
}) => {
    const {deployer} = await getNamedAccounts();
    const nft = await deployments.get('HugoNFT');
    const chain_id = await getChainId();
    let contract = 'HugoNest';
    if (chain_id.toString() === '97') {
        contract = 'TestHugoNest';
    }

    console.log('Using contract -', contract);

    const nest = await deployments.deploy(contract, {
        from: deployer,
        log: true,
        gasLimit: 20000000,
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
            init: {
                methodName: 'initialize',
                args: [owner, HUGO_ADDR, nft.address, BENEFICIARY, PANCAKE, prices, WBNB, BUSD, hugo_egg_discount],
            }
        }
    });
    console.log('Nest address', nest.address);
};
module.exports.tags = ['Nest'];
