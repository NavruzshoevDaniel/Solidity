// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface ILiquidityPool {

    function initialize(address tokenA, address tokenB) external;

    function tokenLeft() external view returns (address);

    function tokenRight() external view returns (address);

    function addLiquidity(uint256 amountA, uint256 amountB) external;

    function removeLiquidity(uint256 shares) external;

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address to
    ) external;
}