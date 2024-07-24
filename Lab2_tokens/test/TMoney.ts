import {loadFixture,} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {expect} from "chai";
import hre from "hardhat";

describe("TMoney", function () {
  async function deployTMoneyFixture() {
    const [owner, account1, account2] = await hre.ethers.getSigners();
    const TMoney = await hre.ethers.getContractFactory("TMoney");
    const tmoney = await TMoney.connect(owner).deploy(BigInt(51995716056975351));
    return {tmoney, owner, account1, account2};
  }

  describe("Deployment", function () {
    it("Should set the right initial balance and total supply", async function () {
      const {tmoney, owner} = await loadFixture(deployTMoneyFixture);

      expect(await tmoney.totalSupply()).to.equal(BigInt(51995716056975351));
      expect(await tmoney.balanceOf(owner.address)).to.equal(BigInt(51995716056975351));
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

    it("Should fail if the sender doesn't have enough funds", async function () {
      const {tmoney, owner, account1} = await loadFixture(deployTMoneyFixture);

      await expect(tmoney.connect(account1).transfer(owner.address, BigInt(1000)))
      .to.be.revertedWith("Insufficient balance");
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
      .to.be.revertedWith("Insufficient balance");
    });

    it("Should fail if the sender is not approved", async function () {
      const {tmoney, owner, account1, account2} = await loadFixture(deployTMoneyFixture);

      await expect(tmoney.connect(account1).transferFrom(owner.address, account2.address, BigInt(100)))
      .to.be.revertedWith("Not approved");
    });
  });
});
