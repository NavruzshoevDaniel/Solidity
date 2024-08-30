import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import "@openzeppelin/hardhat-upgrades";

describe("UUPSProxy", function () {
  async function deployUUPSProxyFixture() {
    const [owner, account1, account2] = await hre.ethers.getSigners();
    const ERC20UpgradableMockV1 = await hre.ethers.getContractFactory("ERC20UpgradableMockV1");
    const proxy = await hre.upgrades.deployProxy(ERC20UpgradableMockV1, ["Token", "TKN"], {
      initializer: "initialize",
      kind: "uups",
    });
    const erc20UpgradableMockV1 = ERC20UpgradableMockV1.attach(
      await proxy.getAddress(),
    ) as ERC20UpgradableMockV1;
    return { erc20UpgradableMockV1, owner, account1, account2 };
  }

  it("should deploy UUPSProxy", async function () {
    const { erc20UpgradableMockV1, owner } = await loadFixture(deployUUPSProxyFixture);
    expect(await erc20UpgradableMockV1.name()).to.equal("Token");
    expect(await erc20UpgradableMockV1.symbol()).to.equal("TKN");
    expect(await erc20UpgradableMockV1.decimals()).to.equal(18);
    expect(await erc20UpgradableMockV1.owner()).to.equal(owner.address);
  });

  it("should upgrade UUPSProxy", async function () {
    const { erc20UpgradableMockV1, owner } = await loadFixture(deployUUPSProxyFixture);
    const ERC20UpgradableMockV2 = await hre.ethers.getContractFactory("ERC20UpgradableMockV2");
    const proxy = await hre.upgrades.upgradeProxy(erc20UpgradableMockV1, ERC20UpgradableMockV2, {
      kind: "uups",
      call: {
        fn: "initialize",
        args: ["TokenPermit"],
      },
    });
    const erc20UpgradableMockV2 = ERC20UpgradableMockV2.attach(
      await proxy.getAddress(),
    ) as ERC20UpgradableMockV2;
    expect(await erc20UpgradableMockV2.name()).to.equal("Token");
    expect(await erc20UpgradableMockV2.symbol()).to.equal("TKN");
    expect(await erc20UpgradableMockV2.decimals()).to.equal(18);
    expect(await erc20UpgradableMockV2.owner()).to.equal(owner.address);
    expect(await erc20UpgradableMockV2.newVar()).to.equal(111);
    expect(await erc20UpgradableMockV2.DOMAIN_SEPARATOR()).to.equal(
      "0x36be28dd54e1b32d11ff0e2bfe29966e93ebdd644a6cd31b00761a531703c0c6",
    );
  });

  it("should not update due to auth", async () => {
    const { erc20UpgradableMockV1, account1 } = await loadFixture(deployUUPSProxyFixture);
    const ERC20UpgradableMockV2 = await hre.ethers.getContractFactory("ERC20UpgradableMockV2");
    await expect(
      hre.upgrades.upgradeProxy(erc20UpgradableMockV1, ERC20UpgradableMockV2.connect(account1), {
        kind: "uups",
        call: {
          fn: "initialize",
          args: ["TokenPermit"],
        },
      }),
    ).to.be.revertedWithCustomError(ERC20UpgradableMockV2, "OwnableUnauthorizedAccount");
  });
});
