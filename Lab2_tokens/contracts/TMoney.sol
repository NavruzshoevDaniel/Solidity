// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TMoney is IERC20, Ownable {
    string public constant name = "TMoney";
    string public constant symbol = "TMNY";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) internal allowances;

    constructor(uint256 initialTotalSupply) Ownable(msg.sender) {
        totalSupply = initialTotalSupply;
        balanceOf[msg.sender] = initialTotalSupply;
    }

    function transfer(address to, uint256 value) external override returns (bool) {
        uint256 balance = balanceOf[msg.sender];
        if (balance < value) {
            revert IERC20Errors.ERC20InsufficientBalance(msg.sender, balance, value);
        }
        if (to == address(0)) {
            revert IERC20Errors.ERC20InvalidReceiver(to);
        }
        balanceOf[msg.sender] = balance - value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external override returns (bool) {
        if (spender == address(0)) {
            revert IERC20Errors.ERC20InvalidSpender(spender);
        }
        allowances[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        return allowances[owner][spender];
    }

    function transferFrom(address from, address to, uint256 value) external override returns (bool) {
        if (to == address(0)) {
            revert IERC20Errors.ERC20InvalidReceiver(to);
        }
        uint256 balance = balanceOf[from];
        if (balance < value) {
            revert IERC20Errors.ERC20InsufficientBalance(from, balance, value);
        }
        uint256 senderAllowanceAmount = allowances[from][msg.sender];
        if (senderAllowanceAmount < value) {
            revert IERC20Errors.ERC20InsufficientAllowance(msg.sender, senderAllowanceAmount, value);
        }
        balanceOf[from] = balance - value;
        balanceOf[to] += value;
        allowances[from][msg.sender] = senderAllowanceAmount - value;
        emit Transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 value) external onlyOwner {
        if (to == address(0)) {
            revert IERC20Errors.ERC20InvalidReceiver(to);
        }
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }

    function burn(uint256 value) external {
        uint256 balance = balanceOf[msg.sender];
        if (balance < value) {
            revert IERC20Errors.ERC20InsufficientBalance(msg.sender, balance, value);
        }
        balanceOf[msg.sender] = balance - value;
        totalSupply -= value;
        emit Transfer(msg.sender, address(0), value);
    }
}
