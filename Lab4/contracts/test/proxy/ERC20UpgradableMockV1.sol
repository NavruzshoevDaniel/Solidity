// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

contract ERC20UpgradableMockV1 is UUPSUpgradeable, OwnableUpgradeable, ERC20Upgradeable {

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory name, string memory symbol) public initializer {
        __ERC20_init(name, symbol);
        __Ownable_init(_msgSender());
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}