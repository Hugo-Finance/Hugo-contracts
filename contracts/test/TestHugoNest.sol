pragma solidity ^0.8.0;

import "../nft/HugoNest.sol";


contract TestHugoNest is HugoNest {
    uint32 constant public VAULT_RELOAD_TIME_test = 5 minutes;

    function vaultDeposit(uint256 amount) external override onlyEOA {
        // we calculate delta, because HUGO has on-transfer fee
        uint256 balance_before = IERC20(HUGO).balanceOf(address(this));
        IERC20(HUGO).transferFrom(msg.sender, address(this), amount);
        uint256 balance_after = IERC20(HUGO).balanceOf(address(this));

        uint256 tokens_sent = balance_after - balance_before;

        UserData storage _user_data = user_data[msg.sender];

        _user_data.vault_staked_tokens += tokens_sent;
        _user_data.vault_level = _calculateVaultLevel(_user_data.vault_staked_tokens);
        _user_data.vault_reward_at = uint32(block.timestamp + VAULT_RELOAD_TIME_test);

        emit VaultDeposit(msg.sender, tokens_sent, _user_data.vault_level);
    }

    function _getIncubatorHatchTime(IncubatorLevel _level) internal pure override returns (uint32) {
        if (_level == IncubatorLevel.LVL_3) {
            return 3 days;
        } else if (_level == IncubatorLevel.LVL_2) {
            return 4 days;
        } else if (_level == IncubatorLevel.LVL_1) {
            return 5 days;
        } else {
            return 10 days;
        }
    }
}
