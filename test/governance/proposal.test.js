const logger = require('mocha-logger');
const { expect } = require('chai');
const { expectRevert } = require('@openzeppelin/test-helpers');
const {
  increaseTime,
  encodeParameters,
  mineBlock,
} = require('../utils/Ethereum');
const BigNumber = require('bignumber.js');


let accounts;

// Contracts
let hugoToken, hugoDaoProxy, hugoDao, target;

let proposal, proposalId;

const VOTING_DELAY = 14400;
const PROPOSAL_THRESHOLD = "50000000000000000";
const VOTING_PERIOD = 28800;
const TIMELOCK_DELAY = 86400;


describe('Test governance proposal', async function() {
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
  
    it('Deploy target', async function() {
      const Target = await ethers.getContractFactory('Target');
    
      target = await Target.deploy();
      await target.deployed();
    
      logger.log(`Target: ${target.address}`);
    
      const state = await target.state();
      expect(state).to.be.equal(0, 'Wrong target initial state');
    });
  });
  
  describe('Test proposal lifecycle', async function() {
    it('Delegate votes', async function() {
      await hugoToken.delegate(accounts[0].address);
    });
    
    it('Initialize proposal', async function() {
      proposal = [
        [target.address],
        [0],
        ["set(uint256)"],
        [encodeParameters(['uint256'], [123])]
      ];
      
      await hugoDao.propose(...proposal, 'description');
      proposalId = await hugoDao.latestProposalIds(accounts[0].address);
    });

    describe('Check proposal properties', async function() {
      let savedProposal;
      
      it('Load saved proposal', async function() {
        savedProposal = await hugoDao.proposals(proposalId);
      });
      
      it('Check proposal id', async function() {
        expect(savedProposal.id).to.be.equal(proposalId, 'Wrong proposal id');
      });
      
      it('Check proposer', async function() {
        expect(savedProposal.proposer).to.be.equal(accounts[0].address, 'Wrong proposal proposer');
      });
  
      it('Check proposal start block', async function() {
        const proposalBlock = await web3.eth.getBlockNumber();

        expect(savedProposal.startBlock)
          .to.be.equal(proposalBlock + VOTING_DELAY, 'Wrong proposal start block');
      });
  
      it('Check proposal end block', async function() {
        const proposalBlock = await web3.eth.getBlockNumber();

        expect(savedProposal.endBlock)
          .to.be.equal(proposalBlock + VOTING_DELAY + (await hugoDao.votingPeriod()).toNumber(), 'Wrong proposal end block');
      });
      
      it('Check initial votes', async function() {
        expect(savedProposal.forVotes).to.be.equal(0, 'Wrong proposal votes for');
        expect(savedProposal.againstVotes).to.be.equal(0, 'Wrong proposal votes against');
        expect(savedProposal.abstainVotes).to.be.equal(0, 'Wrong proposal votes abstain');
      });
      
      it('Check ETA', async function() {
        expect(savedProposal.eta).to.be.equal(0, 'Wrong proposal eta');
      });
      
      it('Check status', async function() {
        expect(savedProposal.canceled).to.be.equal(false, 'Wrong canceled status');
        expect(savedProposal.executed).to.be.equal(false, 'Wrong executed status');
      });
      
      it('Check targets, values, signatures and calldatas', async function() {
        const savedActions = await hugoDao.getActions(savedProposal.id);

        expect(savedActions.targets).to.deep.equal(proposal[0], 'Wrong proposal targets');
        expect(savedActions[1].map(v => v.toNumber())).to.deep.equal(proposal[1], 'Wrong proposal values');
        expect(savedActions.signatures).to.deep.equal(proposal[2], 'Wrong proposal signatures');
        expect(savedActions.calldatas).to.deep.equal(proposal[3], 'Wrong proposal calldatas');
      });
    });
  
    describe('Check proposal initialization restrictions', async function() {
      it('Check only one active proposal per proposer is allowed', async function() {
        await expectRevert(
          hugoDao.propose(...proposal, 'description'),
          'revert HugoDao::propose: one live proposal per proposer, found an already pending proposal'
        );
      });
    });
  
    describe('Confirm proposal', async function() {
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
      
      describe('Check proposal after receiving votes for', async function() {
        it('Check proposal state', async function() {
          const state = await hugoDao.state(proposalId);
          
          expect(state)
            .to.be.equal(4, 'Wrong proposal state after receive confirmation - not Succeeded');
        });
        
        it('Check proposal votes', async function() {
          // TODO: add exact check for votes
          const savedProposal = await hugoDao.proposals(proposalId);

          expect(savedProposal.forVotes)
            .to.be.above(0, 'Wrong proposal votes for');
          expect(savedProposal.againstVotes)
            .to.be.equal(0, 'Wrong proposal votes against');
          expect(savedProposal.abstainVotes)
            .to.be.equal(0, 'Wrong proposal votes abstain');
        });
      });
      
      describe('Execute proposal actions', async function() {
        it('Add proposal to queue', async function() {
          await hugoDao.queue(proposalId);
  
          const state = await hugoDao.state(proposalId);
          expect(state).to.be.equal(5, 'Wrong proposal state - not queued');
        });
        
        describe('Execute proposal action', async function() {
          it('Try to execute before eta', async function() {
            await expectRevert(
              hugoDao.execute(proposalId),
              'revert Timelock::executeTransaction: Transaction hasn\'t surpassed time lock'
            );
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
            
            await hugoDao.execute(proposalId);
          });
  
          it('Check target state', async function() {
            const state = await target.state();
            
            expect(state)
              .to.be.equal(123, 'Wrong target state after proposal executed');
          });
        });
      });
    });
  });
  
  describe('Test proposal have less votes for than quorum', async function() {
    let poorVoter;

    it('Initialize proposal', async function() {
      proposal = [
        [target.address],
        [0],
        ["set(uint256)"],
        [encodeParameters(['uint256'], [123])]
      ];
    
      await hugoDao.propose(...proposal, 'description');
      proposalId = await hugoDao.latestProposalIds(accounts[0].address);
    });
  
    it('Delegate with too low token balance', async function() {
      [,poorVoter] = accounts;
      
      const quorumVotes = await hugoDao.quorumVotes();

      await hugoToken.transfer(poorVoter.address, quorumVotes.sub(1));
      
      await hugoToken.connect(poorVoter).delegate(poorVoter.address);
    });
    
    it('Move time to the proposal start block', async function() {
      const currentBlock = await web3.eth.getBlockNumber();
  
      const {
        startBlock
      } = await hugoDao.proposals(proposalId);
  
      for (const i of [...Array(startBlock - currentBlock + 1)]) {
        await mineBlock();
      }
    });
    
    it('Vote for proposal', async function() {
      await hugoDao.connect(poorVoter).castVote(proposalId, 1);
    });
    
    it('Move time to the proposal end block', async function() {
      const currentBlock = await web3.eth.getBlockNumber();
  
      const {
        endBlock
      } = await hugoDao.proposals(proposalId);
  
  
      for (const i of [...Array(endBlock - currentBlock + 1)]) {
        await mineBlock();
      }
    });
    
    it('Check proposal defeated', async function() {
      const state = await hugoDao.state(proposalId);
      const {
        forVotes,
        againstVotes
      } = await hugoDao.proposals(proposalId);
  
      const quorumVotes = await hugoDao.quorumVotes();
      
      expect(state).to.be.equal(3, 'Wrong proposal state');
      expect(againstVotes).to.be.equal(0, 'Wrong proposal against votes');
      expect(forVotes).to.be.below(quorumVotes, 'For votes should be less than quorum');
    });
  });
  
  describe('Test proposal defeated if against votes 3 times higher than for votes', async function() {
    let forVoter, againstVoter;
  
    it('Initialize proposal', async function() {
      proposal = [
        [target.address],
        [0],
        ["set(uint256)"],
        [encodeParameters(['uint256'], [123])]
      ];
    
      await hugoDao.propose(...proposal, 'description');
      proposalId = await hugoDao.latestProposalIds(accounts[0].address);
    });
    
    it('Transfer tokens', async function() {
      [,,forVoter,againstVoter] = accounts;

      // Transfer more than quorum votes so the amount of votes is sufficient
      const quorumVotes = await hugoDao.quorumVotes();

      await hugoToken.transfer(forVoter.address, new BigNumber(quorumVotes._hex).times(2).toFixed());
      await hugoToken.transfer(againstVoter.address, new BigNumber(quorumVotes._hex).times(2).times(3).plus(3).toFixed());

      await hugoToken.connect(forVoter).delegate(forVoter.address);
      await hugoToken.connect(againstVoter).delegate(againstVoter.address);
    });
  
    it('Move time to the proposal start block', async function() {
      const currentBlock = await web3.eth.getBlockNumber();
    
      const {
        startBlock
      } = await hugoDao.proposals(proposalId);
    
      for (const i of [...Array(startBlock - currentBlock + 1)]) {
        await mineBlock();
      }
    });
  
    it('Vote for proposal', async function() {
      await hugoDao.connect(forVoter).castVote(proposalId, 1);
      await hugoDao.connect(againstVoter).castVote(proposalId, 0);
    });
  
    it('Move time to the proposal end block', async function() {
      const currentBlock = await web3.eth.getBlockNumber();
    
      const {
        endBlock
      } = await hugoDao.proposals(proposalId);
    
    
      for (const i of [...Array(endBlock - currentBlock + 1)]) {
        await mineBlock();
      }
    });
  
    it('Check proposal defeated', async function() {
      const state = await hugoDao.state(proposalId);
    
      expect(state).to.be.equal(3, 'Wrong proposal state');
    });
  });
});
