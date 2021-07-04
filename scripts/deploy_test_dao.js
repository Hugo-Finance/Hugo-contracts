const VOTING_DELAY = 14400;
const PROPOSAL_THRESHOLD = "1000000000000000";
const VOTING_PERIOD = 28800;
const TIMELOCK_DELAY = 86400;
const BigNumber = require('bignumber.js');
const { encodeParameters } = require('../test/Utils/Ethereum');
const hre = require("hardhat");
const ethers = hre.ethers;

const dummy = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam maximus quam a tincidunt viverra. Praesent nulla ipsum, vulputate sit amet tristique eget, tempus sit amet ex. Sed ut risus a nibh rutrum rhoncus ac ut nulla. Maecenas quis risus vitae ante lacinia laoreet. Duis eget sodales ligula, ut convallis augue. Proin a nunc lectus. Maecenas luctus convallis lorem, aliquet scelerisque enim rutrum sed. In hac habitasse platea dictumst. Aenean rutrum cursus tellus in faucibus. Praesent sem justo, tristique id velit at, auctor pulvinar eros.\n'

const HUGO_ADDR = '0x434F288ff599e1f56fe27CF372be2941543b4171';
const DAO_ADDR = '0x141baC01235969C9b6CFa694d3FBB0F14B873d07';

async function main() {
    accounts = await ethers.getSigners();
    console.log(accounts[0].address);

    // await accounts[0].sendTransaction({to: accounts[1].address, value: '0xB1A2BC2EC50000'})
    // await accounts[0].sendTransaction({to: accounts[2].address, value: '0xB1A2BC2EC50000'})
    // await accounts[0].sendTransaction({to: accounts[3].address, value: '0xB1A2BC2EC50000'})
    // await accounts[0].sendTransaction({to: accounts[4].address, value: '0xB1A2BC2EC50000'})
    // await accounts[0].sendTransaction({to: accounts[5].address, value: '0xB1A2BC2EC50000'})
    // await accounts[0].sendTransaction({to: accounts[6].address, value: '0xB1A2BC2EC50000'})
    // await accounts[0].sendTransaction({to: accounts[7].address, value: '0xB1A2BC2EC50000'})

    // console.log(`Deploying HUGO token`);
    // const HugoToken = await ethers.getContractFactory("HUGO");
    //
    // hugoToken = await HugoToken.deploy([]);
    // await hugoToken.deployed();

    console.log(`Hugo token: ${HUGO_ADDR}`);
    const hugoToken = await ethers.getContractAt('HUGO', HUGO_ADDR);

    const bal0 = await hugoToken.balanceOf(accounts[0].address);
    console.log(bal0.toString());

    const HugoDaoProxy = await ethers.getContractFactory('TestHugoDaoProxy');

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
    hugoDao = await ethers.getContractAt('TestHugoDao', hugoDaoProxy.address);

    const quorumVotes = await hugoDao.quorumVotes();

    console.log(`Transferring tokens to other accounts`)

    await hugoToken.transfer(accounts[1].address, new BigNumber(quorumVotes._hex).times(2).toFixed());
    await hugoToken.transfer(accounts[2].address, new BigNumber(quorumVotes._hex).times(2).toFixed(), {gasLimit: 300000});
    await hugoToken.transfer(accounts[3].address, new BigNumber(quorumVotes._hex).times(2).toFixed(), {gasLimit: 300000});
    await hugoToken.transfer(accounts[4].address, new BigNumber(quorumVotes._hex).times(2).toFixed(), {gasLimit: 300000});
    await hugoToken.transfer(accounts[5].address, new BigNumber(quorumVotes._hex).times(2).toFixed(), {gasLimit: 300000});
    await hugoToken.transfer(accounts[6].address, new BigNumber(quorumVotes._hex).times(2).toFixed(), {gasLimit: 300000});
    await hugoToken.transfer(accounts[7].address, new BigNumber(quorumVotes._hex).times(2).toFixed(), {gasLimit: 300000});

    //
    // const bal1 = await hugoToken.balanceOf(accounts[1].address);
    // console.log(bal1.toString());
    // const bal2 = await hugoToken.balanceOf(accounts[2].address);
    // console.log(bal2.toString());
    // await hugoToken.transfer(accounts[2].address, new BigNumber(quorumVotes._hex).times(10).toFixed());

    console.log(`Delegating votes`);
    await hugoToken.connect(accounts[0]).delegate(accounts[0].address);
    await hugoToken.connect(accounts[1]).delegate(accounts[1].address);
    await hugoToken.connect(accounts[2]).delegate(accounts[2].address);
    await hugoToken.connect(accounts[3]).delegate(accounts[3].address);
    await hugoToken.connect(accounts[4]).delegate(accounts[4].address);
    await hugoToken.connect(accounts[5]).delegate(accounts[5].address);
    await hugoToken.connect(accounts[6]).delegate(accounts[6].address);
    await hugoToken.connect(accounts[7]).delegate(accounts[7].address);


    votes0 = await hugoToken.getCurrentVotes(accounts[0].address);
    console.log(votes0.toString());

    votes1 = await hugoToken.getCurrentVotes(accounts[1].address);
    console.log(votes1.toString());

    votes2 = await hugoToken.getCurrentVotes(accounts[2].address);
    console.log(votes2.toString());

    votes3 = await hugoToken.getCurrentVotes(accounts[3].address);
    console.log(votes3.toString());

    votes4 = await hugoToken.getCurrentVotes(accounts[4].address);
    console.log(votes4.toString());

    votes5 = await hugoToken.getCurrentVotes(accounts[5].address);
    console.log(votes5.toString());

    votes6 = await hugoToken.getCurrentVotes(accounts[6].address);
    console.log(votes6.toString());

    votes7 = await hugoToken.getCurrentVotes(accounts[7].address);
    console.log(votes7.toString());

    const Target = await ethers.getContractFactory('Target');

    target = await Target.deploy();
    await target.deployed();

    console.log(`Target: ${target.address}`);

    console.log(`Initializing proposal`)
    proposal = [
        [target.address],
        [0],
        ["set(uint256)"],
        [encodeParameters(['uint256'], [123])]
    ];

    await hugoDao.propose(...proposal, "Test DAO proposal #1", 'Some long and very smart description.\n' + dummy, 0);
    await hugoDao.connect(accounts[1]).propose(...proposal, "Test DAO proposal #2", 'Some long and very smart description.\n' + dummy, 1);
    await hugoDao.connect(accounts[2]).propose(...proposal, "Test DAO proposal #3", 'Some long and very smart description.\n' + dummy, 2);
    await hugoDao.connect(accounts[3]).propose(...proposal, "Test DAO proposal #4", 'Some long and very smart description.\n' + dummy, 2);
    await hugoDao.connect(accounts[4]).propose(...proposal, "Test DAO proposal #5", 'Some long and very smart description.\n' + dummy, 2);
    await hugoDao.connect(accounts[5]).propose(...proposal, "Test DAO proposal #6", 'Some long and very smart description.\n' + dummy, 2);
    await hugoDao.connect(accounts[6]).propose(...proposal, "Test DAO proposal #7", 'Some long and very smart description.\n' + dummy, 2);
    await hugoDao.connect(accounts[7]).propose(...proposal, "Test DAO proposal #8", 'Some long and very smart description.\n' + dummy, 2);


    const proposals = await hugoDao.proposalCount();
    console.log(proposals.toString());

    // console.log(`Transferring tokens`)
    // await hugoToken.transfer('0x93E05804b0A58668531F65A93AbfA1aD8F7F5B2b', new BigNumber(quorumVotes._hex).times(10).toFixed());
}

main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });