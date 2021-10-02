const VOTING_DELAY = 28800;
const PROPOSAL_THRESHOLD = "1000000000000000";
const VOTING_PERIOD = 144000;
const TIMELOCK_DELAY = 86400;
const hre = require("hardhat");
const ethers = hre.ethers;

const HUGO_ADDR = '0xce195c777e1ce96c30ebec54c91d20417a068706';

async function main() {
    accounts = await ethers.getSigners();
    console.log(accounts[0].address);

    const HugoDaoProxy = await ethers.getContractFactory('HugoDaoProxy');

    hugoDaoProxy = await HugoDaoProxy.deploy(
        HUGO_ADDR,
        TIMELOCK_DELAY,
        VOTING_PERIOD,
        VOTING_DELAY,
        PROPOSAL_THRESHOLD
    );

    await hugoDaoProxy.deployed();

    console.log(`Hugo DAO proxy: ${hugoDaoProxy.address}`);
    console.log(`Hugo DAO implementation: ${(await hugoDaoProxy.implementation())}`);
}

main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });