// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.26;

import "./INativeBank.sol";

contract TBank is INativeBank {
    address public owner;
    bool reentrancyLock;
    uint256 currentVersion;
    mapping(uint256 => mapping(address => uint256)) bankAccounts;

    constructor(address ownerContract){
        owner = ownerContract;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier reentrancyGuard() {
        require(!reentrancyLock, "Reentrancy is not allowed");
        reentrancyLock = true;
        _;
        reentrancyLock = false;
    }

    receive() external payable {
        deposit();
    }

    function balanceOf(address account) external view override returns (uint256) {
        return bankAccounts[currentVersion][account];
    }

    function deposit() public payable override {
        unchecked {
            bankAccounts[currentVersion][msg.sender] += msg.value;
        }
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external override reentrancyGuard {
        if (amount == 0) {
            revert WithdrawalAmountZero(msg.sender);
        }
        uint256 balance = bankAccounts[currentVersion][msg.sender];
        if (balance < amount) {
            revert WithdrawalAmountExceedsBalance(msg.sender, amount, balance);
        }
        unchecked {
            bankAccounts[currentVersion][msg.sender] = balance - amount;
        }
        payable(msg.sender).transfer(amount);
        emit Withdrawal(msg.sender, amount);
    }

    function withdrawAll() external onlyOwner {
        uint256 amount = address(this).balance;
        payable(owner).transfer(amount);
        currentVersion++;
        emit Withdrawal(msg.sender, amount);
    }
}
