// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ILiquidityPool} from "./ILiquidityPool.sol";
import "../test/fabric/LiquidityPoolMock.sol";

contract LiquidityPoolFabric {
    address[] public allPairs;
    mapping(address tokenA => mapping(address tokenB => address liquidityPool)) public liquidityPools;

    error IdenticalTokens(address tokenA, address tokenB);
    error LiquidityPoolExists(address tokenA, address tokenB);
    error ZeroAddress(address tokenA, address tokenB);

    event LiquidityPoolCreated(address indexed tokenA, address indexed tokenB, address indexed liquidityPool);

    function createLiquidityPool(
        address tokenA,
        address tokenB
    ) external {
        if (tokenA == tokenB) {
            revert IdenticalTokens(tokenA, tokenB);
        }
        if (tokenA == address(0) || tokenB == address(0)) {
            revert ZeroAddress(tokenA, tokenB);
        }
        if (liquidityPools[tokenA][tokenB] != address(0) || liquidityPools[tokenB][tokenA] != address(0)) {
            revert LiquidityPoolExists(tokenA, tokenB);
        }

        (address tokenLeft, address tokenRight) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);

        ILiquidityPool liquidityPool = new LiquidityPoolMock();
        liquidityPool.initialize(tokenLeft, tokenRight);
        liquidityPools[tokenLeft][tokenRight] = address(liquidityPool);
        allPairs.push(address(liquidityPool));
        emit LiquidityPoolCreated(tokenLeft, tokenRight, address(liquidityPool));
    }
}