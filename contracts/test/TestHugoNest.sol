pragma solidity ^0.8.0;

import "../nest/HugoNest.sol";


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

    function getVaultReward(RewardType _type) external override onlyEOA {
        UserData storage _user_data = user_data[msg.sender];

        require (!(_user_data.vault_level == VaultLevel.LVL_0), 'HUGO_NEST::getVaultReward: vault is level 0');
        require (_user_data.vault_reward_at <= block.timestamp, 'HUGO_NEST::getVaultReward: vault is reloading');

        VaultLevel vault_lvl = _user_data.vault_level;
        if (_type == RewardType.INCUBATOR) {
            // check if user already got incubator of required lvl
            for (uint i = 0; i < _user_data.incubators.length; i++) {
                Incubator memory _incubator = _user_data.incubators[i];
                if ((vault_lvl == VaultLevel.LVL_1 && _incubator.lvl == IncubatorLevel.LVL_1) ||
                (vault_lvl == VaultLevel.LVL_2 && _incubator.lvl == IncubatorLevel.LVL_2) ||
                    (vault_lvl == VaultLevel.LVL_3 && _incubator.lvl == IncubatorLevel.LVL_3)) {
                    revert ('HUGO_NEST::getVaultReward: incubator already unlocked');
                }
            }
            // ok, give incubator to user
            Incubator memory new_incubator;
            if (vault_lvl == VaultLevel.LVL_1) {
                new_incubator = Incubator(IncubatorLevel.LVL_1, INCUBATOR_MAX_USAGES);
            } else if (vault_lvl == VaultLevel.LVL_2) {
                new_incubator = Incubator(IncubatorLevel.LVL_2, INCUBATOR_MAX_USAGES);
            } else {
                new_incubator = Incubator(IncubatorLevel.LVL_3, INCUBATOR_MAX_USAGES);
            }
            _user_data.incubators.push(new_incubator);
            emit VaultIncubatorReward(msg.sender, new_incubator.lvl);
        } else {
            ConsumableLevel _level;
            if (vault_lvl == VaultLevel.LVL_1) {
                _level = ConsumableLevel.LVL_1;
            } else if (vault_lvl == VaultLevel.LVL_2) {
                _level = ConsumableLevel.LVL_2;
            } else {
                _level = ConsumableLevel.LVL_3;
            }
            _user_data.consumables.push(_level);
            emit VaultConsumableReward(msg.sender, _level);
        }
        _user_data.vault_reward_at = uint32(block.timestamp + VAULT_RELOAD_TIME_test);
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
        if (user_data[receiver].incubators.length == 0) {
            // unlimited usages for lvl 0 incubator
            user_data[receiver].incubators.push(Incubator(IncubatorLevel.LVL_0, 255));
        }
        for (uint i = 0; i < eggs_to_buy.length; i++) {
            user_data[receiver].eggs.push(Egg(eggs_to_buy[i], IncubatorLevel.NONE, ConsumableLevel.NONE, 0));
        }
    }

    function sendIncubator(uint8[] memory levels, address receiver) external {
        UserData storage _user_data = user_data[receiver];

        for (uint i = 0; i < levels.length; i++) {
            Incubator memory new_incubator;
            if (levels[i] == uint8(IncubatorLevel.LVL_1)) {
                new_incubator = Incubator(IncubatorLevel.LVL_1, INCUBATOR_MAX_USAGES);
            } else if (levels[i] == uint8(IncubatorLevel.LVL_2)) {
                new_incubator = Incubator(IncubatorLevel.LVL_2, INCUBATOR_MAX_USAGES);
            } else {
                new_incubator = Incubator(IncubatorLevel.LVL_3, INCUBATOR_MAX_USAGES);
            }
            _user_data.incubators.push(new_incubator);
        }
    }

    function sendConsumable(uint8[] memory levels, address receiver) external {
        UserData storage _user_data = user_data[receiver];

        for (uint i = 0; i < levels.length; i++) {
            ConsumableLevel _level;
            if (levels[i] == uint8(ConsumableLevel.LVL_1)) {
                _level = ConsumableLevel.LVL_1;
            } else if (levels[i] == uint8(ConsumableLevel.LVL_2)) {
                _level = ConsumableLevel.LVL_2;
            } else {
                _level = ConsumableLevel.LVL_3;
            }
            _user_data.consumables.push(_level);
        }
    }
}
