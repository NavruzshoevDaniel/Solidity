// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Permit} from "../../permit/Permit.sol";

contract ERC20TokenPermitMock is Permit {

    constructor(string memory name, string memory symbol) ERC20(name, symbol) Permit(name, "1"){
        _mint(msg.sender, 1000000 * 10 ** 18);
    }
}