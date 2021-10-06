// testnet
const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";

module.exports = async ({
    getNamedAccounts,
    deployments
}) => {
    const {deployer} = await getNamedAccounts();
    const nest = await deployments.get('HugoNest');
    await deployments.execute(
        'HugoNFT',
        {
            from: deployer,
            log: true
        },
        'grantRole',
        MINTER_ROLE,
        nest.address
    );
    console.log('Grant mint role to', nest.address);
};
module.exports.tags = ['GrantRole'];
