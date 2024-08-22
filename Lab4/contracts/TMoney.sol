// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./AccessControl.sol";
import "./erc2771/ERC2771Context.sol";

contract TMoney is ERC2771Context, ERC20, Ownable, AccessControl, ERC20Burnable {
    bytes32 public constant MINTER_ROLE = keccak256(abi.encodePacked("MINTER_ROLE"));
    bytes32 public constant BURNER_ROLE = keccak256(abi.encodePacked("BURNER_ROLE"));

    constructor(
        uint256 initialTotalSupply,
        address trustedForwarder
    ) ERC20("TMoney", "TMNY") Ownable(_msgSender()) ERC2771Context(trustedForwarder) {
        address msgSender = _msgSender();
        _mint(msgSender, initialTotalSupply);
        _grantRole(DEFAULT_ADMIN_ROLE, msgSender);
        _grantRole(MINTER_ROLE, msgSender);
        _grantRole(BURNER_ROLE, msgSender);
        _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(BURNER_ROLE, DEFAULT_ADMIN_ROLE);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(uint256 amount) public override onlyRole(BURNER_ROLE) {
        super.burn(amount);
    }

    function burnFrom(address account, uint256 amount) public override onlyRole(BURNER_ROLE) {
        super.burnFrom(account, amount);
    }

    function _msgSender() internal view override(ERC2771Context, Context) returns (address sender) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(ERC2771Context, Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view override(ERC2771Context, Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }
}