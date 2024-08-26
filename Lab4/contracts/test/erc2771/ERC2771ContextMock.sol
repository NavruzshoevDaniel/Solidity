// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "../../erc2771/ERC2771Context.sol";


contract ERC2771ContextMock is ERC2771Context {
    event MsgSenderAndData(address sender, bytes data);
    event PayableFunctionCalled(address sender, bytes data, uint256 value);
    error TestError(string message);

    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}


    function testMsgSenderAndData() public {
        emit MsgSenderAndData(_msgSender(), _msgData());
    }

    function testMsgSenderAndDataWithArgs(string calldata arg1) public {
        emit MsgSenderAndData(_msgSender(), _msgData());
    }

    function testPayable() public payable {
        emit PayableFunctionCalled(_msgSender(), _msgData(), msg.value);
    }

    function withRevert() public {
        revert("Test revert");
    }

    function withRequire() public {
        require(false, "Test require");
    }

    function withError() public {
        revert TestError("Test error");
    }
}