import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";

describe("LiquidityPoolFabric", function () {
  async function deployLiquidityPoolFabricFixture() {
    const [owner, account1, account2] = await hre.ethers.getSigners();
    const LiquidityPoolFabric = await hre.ethers.getContractFactory("LiquidityPoolFabric");
    const liquidityPoolFabric = await LiquidityPoolFabric.deploy();
    return { liquidityPoolFabric, owner, account1, account2 };
  }

  it("should create a liquidity pool", async function () {
    const { liquidityPoolFabric, account1, account2 } = await loadFixture(
      deployLiquidityPoolFabricFixture,
    );
    const nonce = await hre.ethers.provider.getTransactionCount(
      await liquidityPoolFabric.getAddress(),
    );
    const futureLPAddress = hre.ethers.getCreateAddress({
      from: await liquidityPoolFabric.getAddress(),
      nonce: nonce,
    });
    await expect(await liquidityPoolFabric.createLiquidityPool(account1.address, account2.address))
      .to.emit(liquidityPoolFabric, "LiquidityPoolCreated")
      .withArgs(account2.address, account1.address, futureLPAddress);

    expect(await liquidityPoolFabric.liquidityPools(account2.address, account1.address)).to.equal(
      futureLPAddress,
    );
    expect(await liquidityPoolFabric.allPairs(0)).to.equal(futureLPAddress);
    const lp = await hre.ethers.getContractAt("LiquidityPoolMock", futureLPAddress);
    expect(await lp.tokenLeft()).to.equal(account2.address);
    expect(await lp.tokenRight()).to.equal(account1.address);
  });

  it("should not create a liquidity pool if it already exists", async function () {
    const { liquidityPoolFabric, account1, account2 } = await loadFixture(
      deployLiquidityPoolFabricFixture,
    );
    const nonce = await hre.ethers.provider.getTransactionCount(
      await liquidityPoolFabric.getAddress(),
    );
    const futureLPAddress = hre.ethers.getCreateAddress({
      from: await liquidityPoolFabric.getAddress(),
      nonce: nonce,
    });
    await expect(await liquidityPoolFabric.createLiquidityPool(account1.address, account2.address))
      .to.emit(liquidityPoolFabric, "LiquidityPoolCreated")
      .withArgs(account2.address, account1.address, futureLPAddress);
    await expect(liquidityPoolFabric.createLiquidityPool(account1.address, account2.address))
      .to.be.revertedWithCustomError(liquidityPoolFabric, "LiquidityPoolExists")
      .withArgs(account1.address, account2.address);
  });
});
