// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";

contract ERC20UpgradableMockV2 is UUPSUpgradeable, OwnableUpgradeable, ERC20Upgradeable, ERC20PermitUpgradeable {
    uint256 public newVar;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory name) public reinitializer(2) {
        __ERC20Permit_init(name);
        newVar = 111;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}