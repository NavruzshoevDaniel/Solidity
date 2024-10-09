import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { networkConfig } from "../helper-hardhat-config";
import { expect } from "chai";

const CHAIN_ID = 1;

describe("FlashLoanArbitrage", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFlashLoanArbitrageFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const Dex = await hre.ethers.getContractFactory("Dex");
    const dex = await Dex.deploy(
      networkConfig[CHAIN_ID].daiAddress,
      networkConfig[CHAIN_ID].usdcAddress
    );

    const usdcWhaleAddress = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [usdcWhaleAddress],
    });
    const usdcWhaleSigner = await hre.ethers.getSigner(usdcWhaleAddress);

    const daiWhaleAddress = "0x786F7f37095697221a09F2B2eb82657beaFde435";
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [daiWhaleAddress],
    });
    const daiWhaleSigner = await hre.ethers.getSigner(daiWhaleAddress);

    const usdcContract = await hre.ethers.getContractAt(
      "IERC20",
      networkConfig[CHAIN_ID].usdcAddress
    );
    const daiContract = await hre.ethers.getContractAt(
      "IERC20",
      networkConfig[CHAIN_ID].daiAddress
    );

    console.log(
      "DaiWhale balance: ",
      hre.ethers.formatUnits(await daiContract.balanceOf(daiWhaleAddress), 18)
    );
    console.log(
      "DaiWhale eth balance: ",
      hre.ethers.formatEther(
        await hre.ethers.provider.getBalance(daiWhaleAddress)
      )
    );

    console.log(
      "UsdcWhale balance: ",
      hre.ethers.formatUnits(await usdcContract.balanceOf(usdcWhaleAddress), 6)
    );
    console.log(
      "UsdcWhale eth balance: ",
      hre.ethers.formatEther(
        await hre.ethers.provider.getBalance(usdcWhaleAddress)
      )
    );

    // add liquidity to the mockk dex
    await usdcContract
      .connect(usdcWhaleSigner)
      .transfer(await dex.getAddress(), hre.ethers.parseUnits("1500", 6));
    await daiContract
      .connect(daiWhaleSigner)
      .transfer(await dex.getAddress(), hre.ethers.parseUnits("1500", 18));

    console.log(
      "Dex dai balance: ",
      hre.ethers.formatUnits(
        await daiContract.balanceOf(await dex.getAddress()),
        18
      )
    );
    console.log(
      "Dex usdc balance: ",
      hre.ethers.formatUnits(
        await usdcContract.balanceOf(await dex.getAddress()),
        6
      )
    );
    const FlashLoanArbitrage = await hre.ethers.getContractFactory(
      "FlashLoanArbitrage"
    );
    const flashLoanArbitrage = await FlashLoanArbitrage.deploy(
      networkConfig[CHAIN_ID].PoolAddressesProvider,
      networkConfig[CHAIN_ID].daiAddress,
      networkConfig[CHAIN_ID].usdcAddress,
      await dex.getAddress()
    );

    return {
      flashLoanArbitrage,
      dex,
      usdcContract,
      daiContract,
      owner,
    };
  }

  describe("FlashLoanArbitrage attack", async function () {
    it("Attack", async function () {
      // given
      const { flashLoanArbitrage, usdcContract } = await loadFixture(
        deployFlashLoanArbitrageFixture
      );
      await flashLoanArbitrage.approveUSDC(hre.ethers.parseUnits("1000", 6));
      await flashLoanArbitrage.approveDAI(hre.ethers.parseUnits("1200", 18));
      const beforeUsdcFlashLoanArbitrageBalance =
        await flashLoanArbitrage.getBalance(await usdcContract.getAddress());
      expect(beforeUsdcFlashLoanArbitrageBalance).to.equal(0);

      // when
      const result = expect(
        await flashLoanArbitrage.requestFlashLoan(
          networkConfig[CHAIN_ID].usdcAddress,
          hre.ethers.parseUnits("1000", 6)
        )
      );

      // then
      await result.changeTokenBalance(
        usdcContract,
        await flashLoanArbitrage.getAddress(),
        110611100
      );
    });
  });
});
