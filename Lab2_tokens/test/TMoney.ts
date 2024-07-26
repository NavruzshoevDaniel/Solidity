import {loadFixture,} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {expect} from "chai";
import hre from "hardhat";

const ZERO_ADDRESS = "0x" + "0".repeat(40);
const INITIAL_SUPPLY = BigInt(51995716056975351);

describe("TMoney", function () {
  async function deployTMoneyFixture() {
    const [owner, account1, account2] = await hre.ethers.getSigners();
    const TMoney = await hre.ethers.getContractFactory("TMoney");
    const tmoney = await TMoney.connect(owner).deploy(INITIAL_SUPPLY);
    return {tmoney, owner, account1, account2};
  }

  describe("Deployment", function () {
    it("Should set the right initial balance and total supply", async function () {
      const {tmoney, owner} = await loadFixture(deployTMoneyFixture);

      expect(await tmoney.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await tmoney.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });
  });

  describe("Transfers", function () {
    it("Should transfer the funds to another account", async function () {
      const {tmoney, owner, account1} = await loadFixture(deployTMoneyFixture);

      await tmoney.connect(owner).transfer(account1.address, BigInt(100));
      expect(await tmoney.balanceOf(account1.address)).to.equal(BigInt(100));
    });

    it("Should transfer the funds to another account and emit event", async function () {
      const {tmoney, owner, account1} = await loadFixture(deployTMoneyFixture);

      await expect(tmoney.connect(owner).transfer(account1.address, BigInt(100)))
      .to.emit(tmoney, "Transfer")
      .withArgs(owner.address, account1.address, BigInt(100));
    });

    it("Should transfer the funds with zero amount", async function () {
      const {tmoney, owner, account1} = await loadFixture(deployTMoneyFixture);

      await tmoney.connect(owner).transfer(account1.address, BigInt(0));
      expect(await tmoney.balanceOf(account1.address)).to.equal(BigInt(0));
    });

    it("Should fail if the sender doesn't have enough funds", async function () {
      const {tmoney, owner, account1} = await loadFixture(deployTMoneyFixture);

      await expect(tmoney.connect(account1).transfer(owner.address, BigInt(1000)))
      .to.be.revertedWithCustomError(tmoney, "ERC20InsufficientBalance");
    });

    it("Should fail if recipient is zero address", async function () {
      const {tmoney, owner} = await loadFixture(deployTMoneyFixture);

      await expect(tmoney.connect(owner).transfer(ZERO_ADDRESS, BigInt(100)))
      .to.be.revertedWithCustomError(tmoney, "ERC20InvalidReceiver");
    });
  });

  describe("Approvals", function () {
    it("Should approve an account to transfer funds", async function () {
      const {tmoney, owner, account1} = await loadFixture(deployTMoneyFixture);

      await tmoney.connect(owner).approve(account1.address, BigInt(100));
      expect(await tmoney.allowance(owner.address, account1.address)).to.equal(BigInt(100));
    });

    it("Should approve an account to transfer funds and emit event", async function () {
      const {tmoney, owner, account1} = await loadFixture(deployTMoneyFixture);

      await expect(tmoney.connect(owner).approve(account1.address, BigInt(100)))
      .to.emit(tmoney, "Approval")
      .withArgs(owner.address, account1.address, BigInt(100));
    });

    it("Should not fail if the sender doesn't have enough funds", async function () {
      const {tmoney, owner, account1} = await loadFixture(deployTMoneyFixture);

      await expect(tmoney.connect(account1).approve(owner.address, BigInt(1000)))
      .to.be.not.revertedWithoutReason();
    });

    it("Should fail if spender is zero address", async function () {
      const {tmoney, owner} = await loadFixture(deployTMoneyFixture);

      await expect(tmoney.connect(owner).approve(ZERO_ADDRESS, BigInt(100)))
      .to.be.revertedWithCustomError(tmoney, "ERC20InvalidSpender");
    });
  });

  describe("Transfers from", function () {
    it("Should transfer funds from an approved account", async function () {
      const {tmoney, owner, account1, account2} = await loadFixture(deployTMoneyFixture);

      await tmoney.connect(owner).approve(account1.address, BigInt(100));
      await tmoney.connect(account1).transferFrom(owner.address, account2.address, BigInt(100));
      expect(await tmoney.balanceOf(account2.address)).to.equal(BigInt(100));
    });

    it("Should transfer funds from an approved account and emit event", async function () {
      const {tmoney, owner, account1, account2} = await loadFixture(deployTMoneyFixture);

      await tmoney.connect(owner).approve(account1.address, BigInt(100));
      await expect(tmoney.connect(account1).transferFrom(owner.address, account2.address, BigInt(100)))
      .to.emit(tmoney, "Transfer")
      .withArgs(owner.address, account2.address, BigInt(100));
    });

    it("Should fail if the sender doesn't have enough funds", async function () {
      const {tmoney, owner, account1, account2} = await loadFixture(deployTMoneyFixture);

      await tmoney.connect(account1).approve(owner.address, BigInt(100));
      await expect(tmoney.connect(owner).transferFrom(account1.address, account2.address, BigInt(1000)))
      .to.be.revertedWithCustomError(tmoney, "ERC20InsufficientBalance");
    });

    it("Should fail if the sender is not approved", async function () {
      const {tmoney, owner, account1, account2} = await loadFixture(deployTMoneyFixture);

      await expect(tmoney.connect(account1).transferFrom(owner.address, account2.address, BigInt(100)))
      .to.be.revertedWithCustomError(tmoney, "ERC20InsufficientAllowance");
    });

    it("Should fail if recipient is zero address", async function () {
      const {tmoney, owner, account1} = await loadFixture(deployTMoneyFixture);

      await tmoney.connect(owner).approve(account1.address, BigInt(100));
      await expect(tmoney.connect(account1).transferFrom(owner.address, ZERO_ADDRESS, BigInt(100)))
      .to.be.revertedWithCustomError(tmoney, "ERC20InvalidReceiver");
    });
  });

  describe("Decimals", function () {
    it("Should return the right number of decimals", async function () {
      const {tmoney} = await loadFixture(deployTMoneyFixture);

      expect(await tmoney.decimals()).to.equal(18);
    });
  });

  describe("Name", function () {
    it("Should return the right name", async function () {
      const {tmoney} = await loadFixture(deployTMoneyFixture);

      expect(await tmoney.name()).to.equal("TMoney");
    });
  });

  describe("Symbol", function () {
    it("Should return the right symbol", async function () {
      const {tmoney} = await loadFixture(deployTMoneyFixture);

      expect(await tmoney.symbol()).to.equal("TMNY");
    });
  });

  describe("Allowance", function () {
    it("Should return the right allowance", async function () {
      const {tmoney, owner, account1} = await loadFixture(deployTMoneyFixture);

      await tmoney.connect(owner).approve(account1.address, BigInt(100));
      expect(await tmoney.allowance(owner.address, account1.address)).to.equal(BigInt(100));
    });
  });

  describe("Minting", function () {
    it("Should mint new tokens", async function () {
      const {tmoney, owner} = await loadFixture(deployTMoneyFixture);

      await tmoney.connect(owner).mint(owner.address, BigInt(100));
      expect(await tmoney.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY + BigInt(100));
      expect(await tmoney.totalSupply()).to.equal(BigInt(INITIAL_SUPPLY + BigInt(100)));
    });

    it("Should mint new tokens and emit event", async function () {
      const {tmoney, owner} = await loadFixture(deployTMoneyFixture);

      await expect(tmoney.connect(owner).mint(owner.address, BigInt(100)))
      .to.emit(tmoney, "Transfer")
      .withArgs(ZERO_ADDRESS, owner.address, BigInt(100));
    });

    it("Should fail if the sender is not the owner", async function () {
      const {tmoney, account1} = await loadFixture(deployTMoneyFixture);

      await expect(tmoney.connect(account1).mint(account1.address, BigInt(100)))
      .to.be.revertedWithCustomError(tmoney, "OwnableUnauthorizedAccount");
    });

    it("Should fail if the recipient is zero address", async function () {
      const {tmoney, owner} = await loadFixture(deployTMoneyFixture);

      await expect(tmoney.connect(owner).mint(ZERO_ADDRESS, BigInt(100)))
      .to.be.revertedWithCustomError(tmoney, "ERC20InvalidReceiver");
    });
  });

  describe("Burning", function () {
    it("Should burn tokens", async function () {
      const {tmoney, owner} = await loadFixture(deployTMoneyFixture);

      await tmoney.connect(owner).burn(BigInt(100));
      expect(await tmoney.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - BigInt(100));
      expect(await tmoney.totalSupply()).to.equal(BigInt(INITIAL_SUPPLY - BigInt(100)));
    });

    it("Should burn tokens and emit event", async function () {
      const {tmoney, owner} = await loadFixture(deployTMoneyFixture);

      await expect(tmoney.connect(owner).burn(BigInt(100)))
      .to.emit(tmoney, "Transfer")
      .withArgs(owner.address, ZERO_ADDRESS, BigInt(100));
    });

    it("Should fail if the sender doesn't have enough funds", async function () {
      const {tmoney, account1} = await loadFixture(deployTMoneyFixture);

      await expect(tmoney.connect(account1).burn(BigInt(1000)))
      .to.be.revertedWithCustomError(tmoney, "ERC20InsufficientBalance");
    });
  });
});
