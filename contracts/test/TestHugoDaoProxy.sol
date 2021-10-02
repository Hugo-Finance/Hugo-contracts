// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;
pragma experimental ABIEncoderV2;

import "../interfaces/IDao.sol";
import "../proxy/ERC1967Proxy.sol";
import "../utils/Timelock.sol";
import "./TestHugoDao.sol";


contract TestHugoDaoProxy is ERC1967Proxy, AdminProxyStorage {
    /// @notice Emitted when admin is changed
    event NewAdmin(address oldAdmin, address newAdmin);

    constructor(
        address hugo_,
        uint timelockDelay_,
        uint votingPeriod_,
        uint votingDelay_,
        uint proposalThreshold_
    ) payable {
        assert(_ADMIN_SLOT == bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1));
        assert(_IMPLEMENTATION_SLOT == bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1));

        address timelock_ = address(new Timelock(address(this), timelockDelay_));
        address implementation_ = address(new TestHugoDao());
        // set admin to sender for initializing
        _setAdmin(msg.sender);

        upgradeToAndCall(
            implementation_,
            abi.encodeWithSignature(
                "initialize(address,address,uint256,uint256,uint256)",
                timelock_,
                hugo_,
                votingPeriod_,
                votingDelay_,
                proposalThreshold_
            )
        );

        _setAdmin(timelock_);
    }


    /**
     * @dev Returns the current admin.
     *
     */
    function admin() external view returns (address admin_) {
        admin_ = _admin();
    }

    /**
     * @dev Returns the current implementation.
     */
    function implementation() external view returns (address implementation_) {
        implementation_ = _implementation();
    }

    /**
     * @dev Changes the admin of the proxy.
     *
     * Emits an {NewAdmin} event.
     *
     * NOTE: Only the admin can call this function
     */
    function changeAdmin(address newAdmin) external {
        require(msg.sender == _admin(), "DaoProxy::changeAdmin: admin only");
        require(newAdmin != address(0), "DaoProxy::changeAdmin: new admin is the zero address");
        emit NewAdmin(_admin(), newAdmin);
        _setAdmin(newAdmin);
    }

    /**
     * @dev Upgrade the implementation of the proxy.
     *
     * NOTE: Only the admin can call this function
     */
    function upgradeTo(address newImplementation) external {
        require(msg.sender == _admin(), "DaoProxy::upgradeTo: admin only");
        _upgradeTo(newImplementation);
    }

    /**
     * @dev Upgrade the implementation of the proxy, and then call a function from the new implementation as specified
     * by `data`, which should be an encoded function call. This is useful to initialize new storage variables in the
     * proxied contract.
     *
     * NOTE: Only the admin can call this function
     */
    function upgradeToAndCall(address newImplementation, bytes memory data) public payable {
        require(msg.sender == _admin(), "DaoProxy::upgradeToAndCall: admin only");
        _upgradeTo(newImplementation);
        Address.functionDelegateCall(newImplementation, data);
    }

    /**
     * @dev Stores a new address in the EIP1967 admin slot.
     */
    function _setAdmin(address newAdmin) private {
        bytes32 slot = _ADMIN_SLOT;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            sstore(slot, newAdmin)
        }
    }

}