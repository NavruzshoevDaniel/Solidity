// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ILiquidityPool} from "../../fabric/ILiquidityPool.sol";

contract LiquidityPoolMock is ILiquidityPool{
    address public override tokenLeft;
    address public override tokenRight;

    function initialize(address _tokenLeft, address _tokenRight) external override {
        tokenLeft = _tokenLeft;
        tokenRight = _tokenRight;
    }

    function addLiquidity(uint256 _tokenLeft, uint256 _tokenRight) external override {
        // do nothing
    }

    function removeLiquidity(uint256 shares) external override {
        // do nothing
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address to
    ) external override {
        // do nothing
    }
}