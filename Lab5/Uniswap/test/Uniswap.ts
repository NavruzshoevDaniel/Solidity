import hre from "hardhat";
import { getAddress, getContract, parseUnits } from "viem";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { networkConfigs } from "../helper-hardhat-config";
import { formatEther, formatUnits } from "viem/utils";
import IUniswapV2PairAbi from "@uniswap/v2-periphery/build/IUniswapV2Pair.json";
import IUniswapV2FactoryAbi from "@uniswap/v2-periphery/build/IUniswapV2Factory.json";
import IUniswapV2RouterAbi from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";

const CHAIN_ID = 1;
const networkConfig = networkConfigs[CHAIN_ID];

describe("Uniswap", function () {
  async function deployTCoinFixture() {
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    const tcoin = await hre.viem.deployContract("TCoin", [
      owner.account.address,
    ]);
    await tcoin.write.mint([owner.account.address, parseUnits("1000", 18)]);
    const publicClient = await hre.viem.getPublicClient();
    const uniswapFactory = getContract({
      abi: IUniswapV2FactoryAbi.abi,
      address: networkConfig.uniswapV2Factory as `0x${string}`,
      client: publicClient,
    });
    const uniswapRouter = getContract({
      abi: IUniswapV2RouterAbi.abi,
      address: networkConfig.uniswapV2Router as `0x${string}`,
      client: publicClient,
    });
    const usdcWhaleAddress =
      "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503" as `0x${string}`;
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [usdcWhaleAddress],
    });
    const usdcWhaleSigner = await hre.viem.getWalletClient(usdcWhaleAddress);
    const usdcContract = await hre.viem.getContractAt(
      "IERC20",
      networkConfig.usdcAddress as `0x${string}`,
    );
    console.log(
      "UsdcWhale balance: ",
      formatUnits(
        <bigint>await usdcContract.read.balanceOf([usdcWhaleAddress]),
        6,
      ),
    );
    console.log(
      "UsdcWhale eth balance: ",
      formatEther(await publicClient.getBalance({ address: usdcWhaleAddress })),
    );
    await usdcContract.write.transfer(
      [owner.account.address, parseUnits("100000", 6)],
      {
        account: usdcWhaleSigner.account,
      },
    );
    console.log(
      "Owner balance: ",
      formatUnits(
        <bigint>await usdcContract.read.balanceOf([owner.account.address]),
        6,
      ),
    );

    return {
      tcoin,
      owner,
      usdcWhaleSigner,
      uniswapFactory,
      uniswapRouter,
      usdcContract,
      otherAccount,
      publicClient,
    };
  }

  async function deployTCoinFixtureWithLP() {
    const {
      tcoin,
      owner,
      usdcContract,
      publicClient,
      uniswapFactory,
      uniswapRouter,
    } = await loadFixture(deployTCoinFixture);
    const hash = await uniswapFactory.write.createPair(
      [tcoin.address, usdcContract.address],
      {
        account: owner.account,
      },
    );
    await publicClient.waitForTransactionReceipt({ hash });
    const tCoinToUsdcPoolAddress = (await uniswapFactory.read.getPair([
      tcoin.address,
      usdcContract.address,
    ])) as `0x${string}`;
    const tCoinToUsdcPair = getContract({
      abi: IUniswapV2PairAbi.abi,
      address: tCoinToUsdcPoolAddress,
      client: publicClient,
    });
    return {
      tcoin,
      owner,
      usdcContract,
      uniswapRouter,
      tCoinToUsdcPair,
      publicClient,
    };
  }

  async function deployTCoinFixtureWithLPAndLiquidity() {
    const {
      tcoin,
      owner,
      usdcContract,
      publicClient,
      uniswapFactory,
      uniswapRouter,
    } = await loadFixture(deployTCoinFixture);
    const hash = await uniswapFactory.write.createPair(
      [tcoin.address, usdcContract.address],
      {
        account: owner.account,
      },
    );
    await publicClient.waitForTransactionReceipt({ hash });
    const tCoinToUsdcPoolAddress = (await uniswapFactory.read.getPair([
      tcoin.address,
      usdcContract.address,
    ])) as `0x${string}`;
    const tCoinToUsdcPair = getContract({
      abi: IUniswapV2PairAbi.abi,
      address: tCoinToUsdcPoolAddress,
      client: publicClient,
    });
    await usdcContract.write.approve(
      [uniswapRouter.address, parseUnits("100", 6)],
      {
        account: owner.account,
      },
    );
    await tcoin.write.approve([uniswapRouter.address, parseUnits("100", 18)], {
      account: owner.account,
    });
    const tcoinAmount = parseUnits("100", 18);
    const usdcAmount = parseUnits("100", 6);
    const tcoinAmountMin = parseUnits("90", 18);
    const usdcAmountMin = parseUnits("90", 6);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const hash2 = await uniswapRouter.write.addLiquidity(
      [
        tcoin.address,
        usdcContract.address,
        tcoinAmount,
        usdcAmount,
        tcoinAmountMin,
        usdcAmountMin,
        owner.account.address,
        deadline,
      ],
      {
        account: owner.account,
      },
    );
    await publicClient.waitForTransactionReceipt({ hash: hash2 });
    return {
      tcoin,
      owner,
      usdcContract,
      uniswapRouter,
      tCoinToUsdcPair,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should deploy with right settings", async function () {
      // given
      const { tcoin, owner, usdcContract } =
        await loadFixture(deployTCoinFixture);

      //then
      expect(await tcoin.read.owner()).to.equal(
        getAddress(owner.account.address),
      );
      expect(await tcoin.read.balanceOf([owner.account.address])).to.equal(
        parseUnits("1000", 18),
      );
      expect(
        await usdcContract.read.balanceOf([owner.account.address]),
      ).to.equal(parseUnits("100000", 6));
    });
  });

  describe("Operations", function () {
    it("Should add liquidity to tcoin/usdc pool using router", async function () {
      // given
      const {
        tcoin,
        owner,
        usdcContract,
        publicClient,
        uniswapRouter,
        tCoinToUsdcPair,
      } = await loadFixture(deployTCoinFixtureWithLP);
      //console log balance of tcoin and usdc

      await usdcContract.write.approve(
        [uniswapRouter.address, parseUnits("100", 6)],
        {
          account: owner.account,
        },
      );
      await tcoin.write.approve(
        [uniswapRouter.address, parseUnits("100", 18)],
        {
          account: owner.account,
        },
      );
      // when
      const tcoinAmount = parseUnits("100", 18);
      const usdcAmount = parseUnits("100", 6);
      const tcoinAmountMin = parseUnits("90", 18);
      const usdcAmountMin = parseUnits("90", 6);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const hash = await uniswapRouter.write.addLiquidity(
        [
          tcoin.address,
          usdcContract.address,
          tcoinAmount,
          usdcAmount,
          tcoinAmountMin,
          usdcAmountMin,
          owner.account.address,
          deadline,
        ],
        {
          account: owner.account,
        },
      );
      const transRecipient = await publicClient.waitForTransactionReceipt({
        hash,
      });

      // then
      //check lp pairs event
      const lpPairs = await tcoin.getEvents.Transfer();
      expect(lpPairs).to.have.lengthOf(1);
      expect(lpPairs[0].args.from).to.equal(getAddress(owner.account.address));
      expect(lpPairs[0].args.to).to.equal(getAddress(tCoinToUsdcPair.address));
      //check balance of lp pairs
      const lpBalance = (await tCoinToUsdcPair.read.balanceOf(
        [owner.account.address],
        {
          account: owner.account,
        },
      )) as bigint;
      console.log("LP Balance: ", formatUnits(lpBalance, 18));
      expect(Number(lpBalance)).to.gt(0);
      //check balance of tcoin and usdc
      expect(await tcoin.read.balanceOf([owner.account.address])).to.equal(
        parseUnits("900", 18),
      );
      expect(
        await usdcContract.read.balanceOf([owner.account.address]),
      ).to.equal(parseUnits("99900", 6));
      //check pair balance
      expect(await tcoin.read.balanceOf([tCoinToUsdcPair.address])).to.equal(
        tcoinAmount,
      );
      expect(
        await usdcContract.read.balanceOf([tCoinToUsdcPair.address]),
      ).to.equal(usdcAmount);
    });

    it("Should swap tcoin for usdc", async function () {
      // given
      const {
        tcoin,
        owner,
        usdcContract,
        tCoinToUsdcPair,
        publicClient,
        uniswapRouter,
      } = await loadFixture(deployTCoinFixtureWithLPAndLiquidity);
      console.log(
        "Owner tcoin balance before swap: ",
        formatUnits(
          <bigint>await tcoin.read.balanceOf([owner.account.address]),
          18,
        ),
      );
      console.log(
        "Owner usdc balance before swap: ",
        formatUnits(
          <bigint>await usdcContract.read.balanceOf([owner.account.address]),
          6,
        ),
      );
      console.log(
        "Owner tcoin/usdc lp balance before swap: ",
        formatUnits(
          <bigint>await tcoin.read.balanceOf([owner.account.address]),
          18,
        ),
      );
      console.log(
        "Pair tcoin balance before swap: ",
        formatUnits(
          <bigint>await tcoin.read.balanceOf([tCoinToUsdcPair.address]),
          18,
        ),
      );
      console.log(
        "Pair usdc balance before swap: ",
        formatUnits(
          <bigint>await usdcContract.read.balanceOf([tCoinToUsdcPair.address]),
          6,
        ),
      );

      // when
      const tcoinAmount = parseUnits("10", 18);
      const usdcAmountOutMin = parseUnits("0", 6);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const path = [tcoin.address, usdcContract.address];
      await tcoin.write.approve([uniswapRouter.address, parseUnits("10", 18)], {
        account: owner.account,
      });
      const hash = await uniswapRouter.write.swapExactTokensForTokens(
        [tcoinAmount, usdcAmountOutMin, path, owner.account.address, deadline],
        {
          account: owner.account,
        },
      );
      await publicClient.waitForTransactionReceipt({ hash });
      // then
      console.log(
        "Owner tcoin balance after swap: ",
        formatUnits(
          <bigint>await tcoin.read.balanceOf([owner.account.address]),
          18,
        ),
      );
      console.log(
        "Owner usdc balance after swap: ",
        formatUnits(
          <bigint>await usdcContract.read.balanceOf([owner.account.address]),
          6,
        ),
      );
      expect(await tcoin.read.balanceOf([owner.account.address])).to.equal(
        parseUnits("890", 18),
      );
      expect(
        await usdcContract.read.balanceOf([owner.account.address]),
      ).to.equal(parseUnits("99909.066108", 6));
    });

    it("Should swap usdc for tcoin", async function () {
      // given
      const {
        tcoin,
        owner,
        usdcContract,
        tCoinToUsdcPair,
        publicClient,
        uniswapRouter,
      } = await loadFixture(deployTCoinFixtureWithLPAndLiquidity);
      console.log(
        "Owner tcoin balance before swap: ",
        formatUnits(
          <bigint>await tcoin.read.balanceOf([owner.account.address]),
          18,
        ),
      );
      console.log(
        "Owner usdc balance before swap: ",
        formatUnits(
          <bigint>await usdcContract.read.balanceOf([owner.account.address]),
          6,
        ),
      );
      console.log(
        "Owner tcoin/usdc lp balance before swap: ",
        formatUnits(
          <bigint>await tcoin.read.balanceOf([owner.account.address]),
          18,
        ),
      );
      console.log(
        "Pair tcoin balance before swap: ",
        formatUnits(
          <bigint>await tcoin.read.balanceOf([tCoinToUsdcPair.address]),
          18,
        ),
      );
      console.log(
        "Pair usdc balance before swap: ",
        formatUnits(
          <bigint>await usdcContract.read.balanceOf([tCoinToUsdcPair.address]),
          6,
        ),
      );

      // when
      const usdcAmount = parseUnits("10", 6);
      const tcoinAmountOutMin = parseUnits("0", 18);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const path = [usdcContract.address, tcoin.address];
      await usdcContract.write.approve(
        [uniswapRouter.address, parseUnits("10", 6)],
        {
          account: owner.account,
        },
      );
      const hash = await uniswapRouter.write.swapExactTokensForTokens(
        [usdcAmount, tcoinAmountOutMin, path, owner.account.address, deadline],
        {
          account: owner.account,
        },
      );
      await publicClient.waitForTransactionReceipt({ hash });
      // then
      console.log(
        "Owner tcoin balance after swap: ",
        formatUnits(
          <bigint>await tcoin.read.balanceOf([owner.account.address]),
          18,
        ),
      );
      console.log(
        "Owner usdc balance after swap: ",
        formatUnits(
          <bigint>await usdcContract.read.balanceOf([owner.account.address]),
          6,
        ),
      );
      expect(await tcoin.read.balanceOf([owner.account.address])).to.equal(
        parseUnits("909.066108938801491315", 18),
      );
      expect(
        await usdcContract.read.balanceOf([owner.account.address]),
      ).to.equal(parseUnits("99890.000000", 6));
    });
  });
});
