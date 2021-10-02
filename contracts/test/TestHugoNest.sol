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
            return 2 minutes;
        } else if (_level == IncubatorLevel.LVL_2) {
            return 4 minutes;
        } else if (_level == IncubatorLevel.LVL_1) {
            return 6 minutes;
        } else {
            return 8 minutes;
        }
    }

    function sendEgg(uint8[] calldata eggs_to_buy, address receiver) external {
        require (eggs_to_buy.length <= remainingEggs(), 'HUGO_NEST::buyEggs: eggs limit reached');
        for (uint i = 0; i < eggs_to_buy.length; i++) {
            require (eggs_to_buy[i] - 1 < eggs_prices_usd.length, 'HUGO_NEST::buyEggs:bad egg price id');
        }

        eggs_purchased += eggs_to_buy.length;
        // user 1st purchase, grant lvl 0 incubator
        if (user_data[msg.sender].incubators.length == 0) {
            // unlimited usages for lvl 0 incubator
            user_data[msg.sender].incubators.push(Incubator(IncubatorLevel.LVL_0, 255));
        }
        for (uint i = 0; i < eggs_to_buy.length; i++) {
            user_data[msg.sender].eggs.push(Egg(eggs_to_buy[i], IncubatorLevel.NONE, ConsumableLevel.NONE, 0));
        }
    }
}
