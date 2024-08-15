import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("TMoney v2", function () {
  async function deployTMoneyFixture() {
    const [owner, account1, account2, account3] = await hre.ethers.getSigners();
    const TMoney = await hre.ethers.getContractFactory("TMoney");
    const tMoney = await TMoney.deploy(BigInt(1_000_000_000_000_000_000n));
    return { tMoney, owner, account1, account2, account3 };
  }

  describe("Deployment", function () {
    it("Should deploy TMoney", async function () {
      const { tMoney } = await loadFixture(deployTMoneyFixture);
      expect(await tMoney.totalSupply()).to.equal(1_000_000_000_000_000_000n);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const { tMoney, owner } = await loadFixture(deployTMoneyFixture);
      const ownerBalance = await tMoney.balanceOf(owner.address);
      expect(await tMoney.totalSupply()).to.equal(ownerBalance);
    });

    it("Should set right roles", async function () {
      const { tMoney, owner, account1 } = await loadFixture(deployTMoneyFixture);
      expect(await tMoney.hasRole(await tMoney.MINTER_ROLE(), owner.address)).to.be.equal(true);
      expect(await tMoney.hasRole(await tMoney.BURNER_ROLE(), owner.address)).to.be.equal(true);
      expect(await tMoney.hasRole(await tMoney.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.equal(
        true,
      );

      expect(await tMoney.hasRole(await tMoney.MINTER_ROLE(), account1.address)).to.be.equal(false);
      expect(await tMoney.hasRole(await tMoney.BURNER_ROLE(), account1.address)).to.be.equal(false);
      expect(await tMoney.hasRole(await tMoney.DEFAULT_ADMIN_ROLE(), account1.address)).to.be.equal(
        false,
      );
    });

    it("Should set right admin roles", async function () {
      const { tMoney } = await loadFixture(deployTMoneyFixture);
      expect(await tMoney.getRoleAdmin(await tMoney.MINTER_ROLE())).to.be.equal(
        await tMoney.DEFAULT_ADMIN_ROLE(),
      );
      expect(await tMoney.getRoleAdmin(await tMoney.BURNER_ROLE())).to.be.equal(
        await tMoney.DEFAULT_ADMIN_ROLE(),
      );
      expect(await tMoney.getRoleAdmin(await tMoney.DEFAULT_ADMIN_ROLE())).to.be.equal(
        await tMoney.DEFAULT_ADMIN_ROLE(),
      );
    });
  });

  describe("Access control", function () {
    it("Should grant MINTER_ROLE to account1", async function () {
      const { tMoney, owner, account1 } = await loadFixture(deployTMoneyFixture);
      await tMoney.connect(owner).grantRole(await tMoney.MINTER_ROLE(), account1.address);
      expect(await tMoney.hasRole(await tMoney.MINTER_ROLE(), account1.address)).to.be.equal(true);
    });

    it("Should grant MINTER_ROLE to account1 and emit event", async function () {
      const { tMoney, owner, account1 } = await loadFixture(deployTMoneyFixture);
      await expect(tMoney.connect(owner).grantRole(await tMoney.MINTER_ROLE(), account1.address))
        .to.emit(tMoney, "RoleGranted")
        .withArgs(await tMoney.MINTER_ROLE(), account1.address, owner.address);
    });

    it("Should not emit event when MINER_ROLE is already granted", async function () {
      const { tMoney, owner, account1 } = await loadFixture(deployTMoneyFixture);
      await tMoney.connect(owner).grantRole(await tMoney.MINTER_ROLE(), account1.address);
      await expect(
        tMoney.connect(owner).grantRole(await tMoney.MINTER_ROLE(), account1.address),
      ).to.not.emit(tMoney, "RoleGranted");
    });

    it("Should grant BURNER_ROLE to account1", async function () {
      const { tMoney, owner, account1 } = await loadFixture(deployTMoneyFixture);
      await tMoney.connect(owner).grantRole(await tMoney.BURNER_ROLE(), account1.address);
      expect(await tMoney.hasRole(await tMoney.BURNER_ROLE(), account1.address)).to.be.equal(true);
    });

    it("Should grant DEFAULT_ADMIN_ROLE to account1", async function () {
      const { tMoney, owner, account1 } = await loadFixture(deployTMoneyFixture);
      await tMoney.connect(owner).grantRole(await tMoney.DEFAULT_ADMIN_ROLE(), account1.address);
      expect(await tMoney.hasRole(await tMoney.DEFAULT_ADMIN_ROLE(), account1.address)).to.be.equal(
        true,
      );
    });

    it("Should revoke MINTER_ROLE from account1", async function () {
      const { tMoney, owner, account1 } = await loadFixture(deployTMoneyFixture);
      await tMoney.connect(owner).grantRole(await tMoney.MINTER_ROLE(), account1.address);
      await tMoney.connect(owner).revokeRole(await tMoney.MINTER_ROLE(), account1.address);
      expect(await tMoney.hasRole(await tMoney.MINTER_ROLE(), account1.address)).to.be.equal(false);
    });

    it("Should revoke MINTER_ROLE from account1 and emit event", async function () {
      const { tMoney, owner, account1 } = await loadFixture(deployTMoneyFixture);
      await tMoney.connect(owner).grantRole(await tMoney.MINTER_ROLE(), account1.address);
      await expect(tMoney.connect(owner).revokeRole(await tMoney.MINTER_ROLE(), account1.address))
        .to.emit(tMoney, "RoleRevoked")
        .withArgs(await tMoney.MINTER_ROLE(), account1.address, owner.address);
    });

    it("Should not emit event when MINER_ROLE is already revoked", async function () {
      const { tMoney, owner, account1 } = await loadFixture(deployTMoneyFixture);
      await tMoney.connect(owner).grantRole(await tMoney.MINTER_ROLE(), account1.address);
      await tMoney.connect(owner).revokeRole(await tMoney.MINTER_ROLE(), account1.address);
      await expect(
        tMoney.connect(owner).revokeRole(await tMoney.MINTER_ROLE(), account1.address),
      ).to.not.emit(tMoney, "RoleRevoked");
    });

    it("Should revoke BURNER_ROLE from account1", async function () {
      const { tMoney, owner, account1 } = await loadFixture(deployTMoneyFixture);
      await tMoney.connect(owner).grantRole(await tMoney.BURNER_ROLE(), account1.address);
      await tMoney.connect(owner).revokeRole(await tMoney.BURNER_ROLE(), account1.address);
      expect(await tMoney.hasRole(await tMoney.BURNER_ROLE(), account1.address)).to.be.equal(false);
    });

    it("Should revoke DEFAULT_ADMIN_ROLE from account1", async function () {
      const { tMoney, owner, account1 } = await loadFixture(deployTMoneyFixture);
      await tMoney.connect(owner).grantRole(await tMoney.DEFAULT_ADMIN_ROLE(), account1.address);
      await tMoney.connect(owner).revokeRole(await tMoney.DEFAULT_ADMIN_ROLE(), account1.address);
      expect(await tMoney.hasRole(await tMoney.DEFAULT_ADMIN_ROLE(), account1.address)).to.be.equal(
        false,
      );
    });

    it("Should fail if account1 tries to grant MINTER_ROLE", async function () {
      const { tMoney, account1 } = await loadFixture(deployTMoneyFixture);
      await expect(
        tMoney.connect(account1).grantRole(await tMoney.MINTER_ROLE(), account1.address),
      ).to.be.revertedWithCustomError(tMoney, "AccessControlUnauthorizedAccount");
    });

    it("Should fail if account1 tries to grant BURNER_ROLE", async function () {
      const { tMoney, account1 } = await loadFixture(deployTMoneyFixture);
      await expect(
        tMoney.connect(account1).grantRole(await tMoney.BURNER_ROLE(), account1.address),
      ).to.be.revertedWithCustomError(tMoney, "AccessControlUnauthorizedAccount");
    });

    it("Should fail if account1 tries to grant DEFAULT_ADMIN_ROLE", async function () {
      const { tMoney, account1 } = await loadFixture(deployTMoneyFixture);
      await expect(
        tMoney.connect(account1).grantRole(await tMoney.DEFAULT_ADMIN_ROLE(), account1.address),
      ).to.be.revertedWithCustomError(tMoney, "AccessControlUnauthorizedAccount");
    });

    it("Should fail when account1 tries to mint", async function () {
      const { tMoney, account1 } = await loadFixture(deployTMoneyFixture);
      await expect(
        tMoney.connect(account1).mint(account1.address, 100),
      ).to.be.revertedWithCustomError(tMoney, "AccessControlUnauthorizedAccount");
    });

    it("Should fail when account1 tries to burn", async function () {
      const { tMoney, account1 } = await loadFixture(deployTMoneyFixture);
      await expect(tMoney.connect(account1).burn(100)).to.be.revertedWithCustomError(
        tMoney,
        "AccessControlUnauthorizedAccount",
      );
    });

    it("Should mint when account1 has MINTER_ROLE", async function () {
      const { tMoney, account1 } = await loadFixture(deployTMoneyFixture);
      await tMoney.grantRole(await tMoney.MINTER_ROLE(), account1.address);
      await tMoney.connect(account1).mint(account1.address, 100);
      expect(await tMoney.balanceOf(account1.address)).to.be.equal(100);
    });

    it("Should burn when account1 has BURNER_ROLE", async function () {
      const { tMoney, account1 } = await loadFixture(deployTMoneyFixture);
      await tMoney.grantRole(await tMoney.BURNER_ROLE(), account1.address);
      await tMoney.mint(account1.address, 100);
      await tMoney.connect(account1).burn(100);
      expect(await tMoney.balanceOf(account1.address)).to.be.equal(0);
    });

    it("Should pass when default admin burns", async function () {
      const { tMoney, owner } = await loadFixture(deployTMoneyFixture);
      await tMoney.mint(owner.address, 100);
      await tMoney.connect(owner).burn(100);
      expect(await tMoney.balanceOf(owner.address)).to.be.equal(BigInt(1000000000000000000n));
    });

    it("Should pass when default admin mints", async function () {
      const { tMoney, owner } = await loadFixture(deployTMoneyFixture);
      await tMoney.connect(owner).mint(owner.address, 100);
      expect(await tMoney.balanceOf(owner.address)).to.be.equal(BigInt(1000000000000000100n));
    });

    it("Should pass when default admin mints to account1", async function () {
      const { tMoney, owner, account1 } = await loadFixture(deployTMoneyFixture);
      await tMoney.connect(owner).mint(account1.address, 100);
      expect(await tMoney.balanceOf(account1.address)).to.be.equal(100);
    });

    it("Should pass when default admin mints to account1 and account2", async function () {
      const { tMoney, owner, account1, account2 } = await loadFixture(deployTMoneyFixture);
      await tMoney.connect(owner).mint(account1.address, 100);
      await tMoney.connect(owner).mint(account2.address, 100);
      expect(await tMoney.balanceOf(account1.address)).to.be.equal(100);
      expect(await tMoney.balanceOf(account2.address)).to.be.equal(100);
    });

    it("Should pass when default admin revokes MINTER_ROLE from account1", async function () {
      const { tMoney, owner, account1 } = await loadFixture(deployTMoneyFixture);
      await tMoney.grantRole(await tMoney.MINTER_ROLE(), account1.address);
      await tMoney.connect(owner).revokeRole(await tMoney.MINTER_ROLE(), account1.address);
      expect(await tMoney.hasRole(await tMoney.MINTER_ROLE(), account1.address)).to.be.equal(false);
    });

    it("Should pass when default admin revokes BURNER_ROLE from account1", async function () {
      const { tMoney, owner, account1 } = await loadFixture(deployTMoneyFixture);
      await tMoney.grantRole(await tMoney.BURNER_ROLE(), account1.address);
      await tMoney.connect(owner).revokeRole(await tMoney.BURNER_ROLE(), account1.address);
      expect(await tMoney.hasRole(await tMoney.BURNER_ROLE(), account1.address)).to.be.equal(false);
    });

    it("Should pass when default admin revokes DEFAULT_ADMIN_ROLE from account1", async function () {
      const { tMoney, owner, account1 } = await loadFixture(deployTMoneyFixture);
      await tMoney.grantRole(await tMoney.DEFAULT_ADMIN_ROLE(), account1.address);
      await tMoney.connect(owner).revokeRole(await tMoney.DEFAULT_ADMIN_ROLE(), account1.address);
      expect(await tMoney.hasRole(await tMoney.DEFAULT_ADMIN_ROLE(), account1.address)).to.be.equal(
        false,
      );
    });

    it("Should fail when owner renounces account1's MINTER_ROLE", async function () {
      const { tMoney, account1 } = await loadFixture(deployTMoneyFixture);
      await expect(
        tMoney.renounceRole(await tMoney.MINTER_ROLE(), account1.address),
      ).to.be.revertedWithCustomError(tMoney, "AccessControlBadConfirmation");
    });

    it("Should pass when account1 renounces account1's MINTER_ROLE", async function () {
      const { tMoney, account1 } = await loadFixture(deployTMoneyFixture);
      await tMoney.grantRole(await tMoney.MINTER_ROLE(), account1.address);
      await tMoney.connect(account1).renounceRole(await tMoney.MINTER_ROLE(), account1.address);
      expect(await tMoney.hasRole(await tMoney.MINTER_ROLE(), account1.address)).to.be.equal(false);
    });
  });
});
