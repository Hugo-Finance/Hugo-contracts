const { ethers, upgrades } = require("hardhat");


// testnet
const HUGO_ADDR = '0x434f288ff599e1f56fe27cf372be2941543b4171';
const NFT = '0xDdF7151E36607b86dF5Ac6902833a44D06Fb9442';
const PANCAKE = '0x7CC88B95594F84fF4DB6D998c8C30d6b5412dA5d';
const BENEFICIARY = '0x197216E3421D13A72Fdd79A44d8d89f121dcab6C';
const prices = [150, 35, 35, 120, 200, 70, 200, 150, 35, 35, 35, 120, 200, 35, 120];
const WBNB = '0x197216E3421D13A72Fdd79A44d8d89f121dcab6C'; // doesnt matter for test
const BUSD = '0x197216E3421D13A72Fdd79A44d8d89f121dcab6C'; // doesnt matter for test
const owner = '0x93E05804b0A58668531F65A93AbfA1aD8F7F5B2b';
const hugo_egg_discount = 900;

async function main() {
    accounts = await ethers.getSigners();
    console.log(accounts[0].address);

    const HugoNest = await ethers.getContractFactory('TestHugoNest'); // REPLACE WITH REAL FOR PROD
    const hugo_nest = await upgrades.deployProxy(HugoNest, [
        owner, HUGO_ADDR, NFT, BENEFICIARY, PANCAKE, prices, WBNB, BUSD, hugo_egg_discount
    ]);

    await hugo_nest.deployed();

    console.log(`Hugo nest: ${hugo_nest.address}`);
}

main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });