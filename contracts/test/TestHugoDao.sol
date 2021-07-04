
pragma solidity ^0.8.2;
pragma experimental ABIEncoderV2;

import "../governance/IDao.sol";
import "../governance/HugoDao.sol";

contract TestHugoDao is HugoDao {

    function state(uint proposalId) public pure override returns (ProposalState) {
        return HugoDaoStorageV1.ProposalState(proposalId - 1);
    }

}