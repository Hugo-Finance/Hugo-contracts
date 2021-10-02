
pragma solidity ^0.8.2;
pragma experimental ABIEncoderV2;

import "../interfaces/IDao.sol";
import "../governance/HugoDao.sol";

contract TestHugoDao is HugoDao {

    mapping (uint => uint8) public states;

    function setState(uint proposalId, uint8 new_state) public {
        states[proposalId] = new_state;
    }

    function state(uint proposalId) public view override returns (ProposalState) {
        return ProposalState(states[proposalId]);
    }

    function setVotes(uint proposalId, uint pro, uint against) public {
        // against
        emit VoteCast(msg.sender, proposalId, 0, against, "");
        // for
        emit VoteCast(msg.sender, proposalId, 1, pro, "");
    }

}