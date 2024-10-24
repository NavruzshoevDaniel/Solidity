// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WTCoin is ERC20, ERC20Burnable, Ownable {
    constructor()
    ERC20("WTCoin", "WTCO")
    Ownable(_msgSender())
    {}

    function mint(address _recipient, uint256 _amount) public virtual onlyOwner {
        _mint(_recipient, _amount);
    }

    function burnFrom(address _account, uint256 _amount) public virtual override(ERC20Burnable) onlyOwner {
        super.burnFrom(_account, _amount);
    }
}
