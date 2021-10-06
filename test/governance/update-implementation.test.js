const logger = require('mocha-logger');
const { expect } = require('chai');
const { expectRevert } = require('@openzeppelin/test-helpers');
const {
  increaseTime,
  encodeParameters,
  mineBlock,
} = require('../utils/Ethereum');

let accounts;

// Contracts
let hugoToken, hugoDaoProxy, hugoDao, hugoDao2;

let proposal;


const VOTING_DELAY = 14400;
const PROPOSAL_THRESHOLD = "50000000000000000";
const VOTING_PERIOD = 28800;
const TIMELOCK_DELAY = 86400;


describe('Test updating implementation', async function() {
  this.timeout(200000);
  before(async function() {
    accounts = await ethers.getSigners();
  });
  
  describe('Setup governance', async function () {
    it('Deploy HUGO token', async function() {
      const HugoToken = await ethers.getContractFactory("HUGO");
      
      hugoToken = await HugoToken.deploy([]);
      await hugoToken.deployed();
      
      logger.log(`Hugo token: ${hugoToken.address}`);
    });
    
    it('Deploy proxy and setup governance', async function() {
      const HugoDaoProxy = await ethers.getContractFactory('HugoDaoProxy');
      
      hugoDaoProxy = await HugoDaoProxy.deploy(
        hugoToken.address,
        TIMELOCK_DELAY,
        VOTING_PERIOD,
        VOTING_DELAY,
        PROPOSAL_THRESHOLD
      );
      
      await hugoDaoProxy.deployed();
      
      logger.log(`Hugo DAO proxy: ${hugoDaoProxy.address}`);
      logger.log(`Hugo DAO implementation: ${(await hugoDaoProxy.implementation())}`);
    });
    
    it('Setup callable implementation', async function() {
      hugoDao = await ethers.getContractAt('HugoDao', hugoDaoProxy.address);
    });
  });
  
  describe('Test updating DAO implementation', async function() {
    let proposalId;
    
    it('Deploy new HugoDao implementation', async function() {
      const HugoDao2 = await ethers.getContractFactory("HugoDao2");
  
      hugoDao2 = await HugoDao2.deploy([]);
      await hugoDao2.deployed();
  
      logger.log(`Hugo DAO new implementation: ${hugoDao2.address}`);
    });
  
    it('Delegate votes', async function() {
      await hugoToken.delegate(accounts[0].address);
    });
  
    it('Initialize proposal', async function() {
      proposal = [
        [hugoDaoProxy.address],
        [0],
        ["upgradeTo(address)"],
        [encodeParameters(['address'], [hugoDao2.address])]
      ];
    
      await hugoDao.propose(...proposal, 'description');
      proposalId = await hugoDao.latestProposalIds(accounts[0].address);
    });
  
    it('Move time to the proposal start block', async function() {
      const currentBlock = await web3.eth.getBlockNumber();
    
      const {
        startBlock
      } = await hugoDao.proposals(proposalId);
    
    
      for (const i of [...Array(startBlock - currentBlock + 1)]) {
        await mineBlock();
      }
    
      expect((await web3.eth.getBlockNumber()))
        .to.be.above(startBlock, 'Block number should be above proposal start block');
    });
  
    it('Cast vote for proposal', async function() {
      await hugoDao.castVote(proposalId, 1);
    });
  
    it('Move time to the proposal end block', async function() {
      const currentBlock = await web3.eth.getBlockNumber();
    
      const {
        endBlock
      } = await hugoDao.proposals(proposalId);
    
    
      for (const i of [...Array(endBlock - currentBlock + 1)]) {
        await mineBlock();
      }
    
      expect((await web3.eth.getBlockNumber()))
        .to.be.above(endBlock, 'Block number should be above proposal end block');
    });
  
    it('Add proposal to queue', async function() {
      await hugoDao.queue(proposalId);
    
      const state = await hugoDao.state(proposalId);
      expect(state).to.be.equal(5, 'Wrong proposal state - not queued');
    });
  
    it('Move time to the end of timelock', async function() {
      const {
        eta
      } = await hugoDao.proposals(proposalId);
    
      const {
        timestamp: currentTimestamp
      } = await web3.eth.getBlock('latest');
    
      await increaseTime(eta - currentTimestamp + 1);
    
      expect((await web3.eth.getBlock('latest')).timestamp)
        .to.be.above(eta, 'network time should be above eta');
    });
    
    it('Check old implementation is active before proposal executed', async function() {
      const version = await hugoDao.version();
      
      expect(version).to.be.equal(1, 'Wrong Hugo Dao version before implementation update');
    });
    
    it('Execute proposal', async function() {
      await hugoDao.execute(proposalId);
    });
    
    it('Check new implementation is active', async function() {
      const version = await hugoDao.version();
      
      expect(version).to.be.equal(2, 'Wrong Hugo Dao version after implementation update');
    });
  });
});
