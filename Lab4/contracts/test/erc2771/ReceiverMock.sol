// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract ReceiverMock {
    event Received(address sender, uint256 value, bytes data);

    function receiveMock(
        string calldata arg1
    ) external payable {
        emit Received(msg.sender, msg.value, msg.data);
    }
}