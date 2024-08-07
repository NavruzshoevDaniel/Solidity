import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

const ZERO_ADDRESS = "0x" + "0".repeat(40);

describe("Tnft", function () {
  async function deployTnftFixture() {
    const [owner, account1, account2] = await hre.ethers.getSigners();
    const Tnft = await hre.ethers.getContractFactory("Tnft");
    const tnft = await Tnft.connect(owner).deploy();
    return { tnft, owner, account1, account2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { tnft, owner } = await loadFixture(deployTnftFixture);

      expect(await tnft.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should mint a new token", async function () {
      const { tnft, owner } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      expect(await tnft.balanceOf(owner.address)).to.equal(BigInt(1));
    });

    it("Should mint a new token to another address", async function () {
      const { tnft, owner, account1 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(account1.address, BigInt(1));
      expect(await tnft.balanceOf(account1.address)).to.equal(BigInt(1));
    });

    it("Should mint a new token and emit event", async function () {
      const { tnft, owner } = await loadFixture(deployTnftFixture);

      await expect(tnft.connect(owner).mint(owner.address, BigInt(1)))
        .to.emit(tnft, "Transfer")
        .withArgs(ZERO_ADDRESS, owner.address, BigInt(1));
    });

    it("Should fail if recipient is zero address", async function () {
      const { tnft, owner } = await loadFixture(deployTnftFixture);

      await expect(tnft.connect(owner).mint(ZERO_ADDRESS, BigInt(1))).to.be.revertedWithCustomError(
        tnft,
        "ERC721InvalidReceiver",
      );
    });

    it("Should fail if the token already exists", async function () {
      const { tnft, owner } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await expect(
        tnft.connect(owner).mint(owner.address, BigInt(1)),
      ).to.be.revertedWithCustomError(tnft, "ERC721ExistingToken");
    });

    it("Should fail if the sender is not the owner", async function () {
      const { tnft, account1 } = await loadFixture(deployTnftFixture);

      await expect(
        tnft.connect(account1).mint(account1.address, BigInt(1)),
      ).to.be.revertedWithCustomError(tnft, "OwnableUnauthorizedAccount");
    });
  });

  describe("Burning", function () {
    it("Should burn a token", async function () {
      const { tnft, owner } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await tnft.connect(owner).burn(BigInt(1));
      expect(await tnft.balanceOf(owner.address)).to.equal(BigInt(0));
    });

    it("Should burn a token and emit event", async function () {
      const { tnft, owner } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await expect(tnft.connect(owner).burn(BigInt(1)))
        .to.emit(tnft, "Transfer")
        .withArgs(owner.address, ZERO_ADDRESS, BigInt(1));
    });

    it("Should fail if the token does not exist", async function () {
      const { tnft, owner } = await loadFixture(deployTnftFixture);

      await expect(tnft.connect(owner).burn(BigInt(1))).to.be.revertedWithCustomError(
        tnft,
        "ERC721NonexistentToken",
      );
    });

    it("Should fail if the sender is not the owner", async function () {
      const { tnft, owner, account1 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(account1.address, BigInt(1));
      await expect(tnft.connect(account1).burn(BigInt(1))).to.be.revertedWithCustomError(
        tnft,
        "OwnableUnauthorizedAccount",
      );
    });
  });

  describe("Approve", function () {
    it("Should approve an address", async function () {
      const { tnft, owner, account1 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await tnft.connect(owner).approve(account1.address, BigInt(1));
      expect(await tnft.getApproved(BigInt(1))).to.equal(account1.address);
    });

    it("Should approve an address and emit event", async function () {
      const { tnft, owner, account1 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await expect(tnft.connect(owner).approve(account1.address, BigInt(1)))
        .to.emit(tnft, "Approval")
        .withArgs(owner.address, account1.address, BigInt(1));
    });

    it("Should fail if the token does not exist", async function () {
      const { tnft, owner, account1 } = await loadFixture(deployTnftFixture);

      await expect(
        tnft.connect(owner).approve(account1.address, BigInt(1)),
      ).to.be.revertedWithCustomError(tnft, "ERC721NonexistentToken");
    });

    it("Should fail if the sender is not the owner", async function () {
      const { tnft, owner, account1, account2 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await expect(
        tnft.connect(account1).approve(account2.address, BigInt(1)),
      ).to.be.revertedWithCustomError(tnft, "ERC721InvalidOwner");
    });

    it("Should fail if the recipient is zero address", async function () {
      const { tnft, owner } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await expect(
        tnft.connect(owner).approve(ZERO_ADDRESS, BigInt(1)),
      ).to.be.revertedWithCustomError(tnft, "ERC721InvalidReceiver");
    });

    it("Should fail if the sender is the owner", async function () {
      const { tnft, owner } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await expect(
        tnft.connect(owner).approve(owner.address, BigInt(1)),
      ).to.be.revertedWithCustomError(tnft, "ERC721InvalidReceiver");
    });

    it("Should fail if sender has been approved", async function () {
      const { tnft, owner, account1, account2 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await tnft.connect(owner).approve(account1.address, BigInt(1));
      await expect(
        tnft.connect(account1).approve(account2.address, BigInt(1)),
      ).to.be.revertedWithCustomError(tnft, "ERC721InvalidOwner");
    });

    it("Should pass if sender has operatorApprovals", async function () {
      const { tnft, owner, account1, account2 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await tnft.connect(owner).setApprovalForAll(account1.address, true);
      await tnft.connect(account1).approve(account2.address, BigInt(1));
      await expect(tnft.connect(account2).getApproved(BigInt(1)));
    });
  });

  describe("OperatorApprovals", function () {
    it("Should set operator approvals", async function () {
      const { tnft, owner, account1 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).setApprovalForAll(account1.address, true);
      expect(await tnft.isApprovedForAll(owner.address, account1.address)).to.be.true;
    });

    it("Should revoke operator approvals", async function () {
      const { tnft, owner, account1 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).setApprovalForAll(account1.address, true);
      await tnft.connect(owner).setApprovalForAll(account1.address, false);
      expect(await tnft.isApprovedForAll(owner.address, account1.address)).to.be.false;
    });

    it("Should set operator approvals and emit event", async function () {
      const { tnft, owner, account1 } = await loadFixture(deployTnftFixture);

      await expect(tnft.connect(owner).setApprovalForAll(account1.address, true))
        .to.emit(tnft, "ApprovalForAll")
        .withArgs(owner.address, account1.address, true);
    });

    it("Should fail if the operator is the owner", async function () {
      const { tnft, owner } = await loadFixture(deployTnftFixture);

      await expect(
        tnft.connect(owner).setApprovalForAll(owner.address, true),
      ).to.be.revertedWithCustomError(tnft, "ERC721InvalidOperator");
    });

    it("Should pass if the operator has been approved", async function () {
      const { tnft, account1, account2 } = await loadFixture(deployTnftFixture);

      await expect(tnft.connect(account1).setApprovalForAll(account2.address, true));
    });

    it("should fail if zero address is used as operator", async function () {
      const { tnft, owner } = await loadFixture(deployTnftFixture);

      await expect(
        tnft.connect(owner).setApprovalForAll(ZERO_ADDRESS, true),
      ).to.be.revertedWithCustomError(tnft, "ERC721InvalidOperator");
    });

    it("Should pass if the operator has been approved", async function () {
      const { tnft, owner, account1, account2 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).setApprovalForAll(account1.address, true);
      await tnft.connect(account1).setApprovalForAll(account2.address, true);
      expect(await tnft.isApprovedForAll(account1.address, account2.address)).to.be.true;
    });
  });

  describe("Should support interfaces", async function () {
    it("should support ERC165", async function () {
      const { tnft } = await loadFixture(deployTnftFixture);

      expect(await tnft.supportsInterface("0x80ac58cd")).to.be.true; // ERC721
      expect(await tnft.supportsInterface("0x5b5e139f")).to.be.true; // ERC721Metadata
    });
  });

  describe("Should get token URI", async function () {
    it("should return the token URI", async function () {
      const { tnft, owner } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      expect(await tnft.tokenURI(BigInt(1))).to.equal("https://example.com/api/1");
    });
  });

  describe("Should transfer tokens", async function () {
    it("should transfer tokens", async function () {
      const { tnft, owner, account1 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await tnft.connect(owner).transferFrom(owner.address, account1.address, BigInt(1));
      expect(await tnft.balanceOf(account1.address)).to.equal(BigInt(1));
      expect(await tnft.balanceOf(owner.address)).to.equal(BigInt(0));
    });

    it("should transfer tokens and emit event", async function () {
      const { tnft, owner, account1 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await expect(tnft.connect(owner).transferFrom(owner.address, account1.address, BigInt(1)))
        .to.emit(tnft, "Transfer")
        .withArgs(owner.address, account1.address, BigInt(1));
    });

    it("should fail if the sender does not have token", async function () {
      const { tnft, owner, account1 } = await loadFixture(deployTnftFixture);

      await expect(
        tnft.connect(owner).transferFrom(owner.address, account1.address, BigInt(1)),
      ).to.be.revertedWithCustomError(tnft, "ERC721NonexistentToken");
    });

    it("should fail if the sender is not approved", async function () {
      const { tnft, owner, account1, account2 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await expect(
        tnft.connect(account1).transferFrom(owner.address, account2.address, BigInt(1)),
      ).to.be.revertedWithCustomError(tnft, "ERC721InsufficientApproval");
    });

    it("should fail if the recipient is zero address", async function () {
      const { tnft, owner } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await expect(
        tnft.connect(owner).transferFrom(owner.address, ZERO_ADDRESS, BigInt(1)),
      ).to.be.revertedWithCustomError(tnft, "ERC721InvalidReceiver");
    });

    it("should send token by spender with approval", async function () {
      const { tnft, owner, account1, account2 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await tnft.connect(owner).approve(account1.address, BigInt(1));
      await tnft.connect(account1).transferFrom(owner.address, account2.address, BigInt(1));
      expect(await tnft.balanceOf(account2.address)).to.equal(BigInt(1));
      expect(await tnft.balanceOf(owner.address)).to.equal(BigInt(0));
    });

    it("should send token by operator with all approvals", async function () {
      const { tnft, owner, account1, account2 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await tnft.connect(owner).setApprovalForAll(account1.address, true);
      await tnft.connect(account1).transferFrom(owner.address, account2.address, BigInt(1));
      expect(await tnft.balanceOf(account2.address)).to.equal(BigInt(1));
      expect(await tnft.balanceOf(owner.address)).to.equal(BigInt(0));
    });

    it("should fail if the sender is not approved and not operator", async function () {
      const { tnft, owner, account1, account2 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await tnft.connect(owner).approve(account1.address, BigInt(1));
      await expect(
        tnft.connect(account2).transferFrom(owner.address, account1.address, BigInt(1)),
      ).to.be.revertedWithCustomError(tnft, "ERC721InsufficientApproval");
    });
  });

  describe("Safe transfers", async function () {
    it("should transfer tokens safely", async function () {
      const { tnft, owner, account1 } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      await tnft.connect(owner).safeTransferFrom(owner.address, account1.address, BigInt(1));
      expect(await tnft.balanceOf(account1.address)).to.equal(BigInt(1));
      expect(await tnft.balanceOf(owner.address)).to.equal(BigInt(0));
    });

    it("should revert if the recipient is a contract and does not implement ERC721Receiver", async function () {
      const { tnft, owner } = await loadFixture(deployTnftFixture);

      await tnft.connect(owner).mint(owner.address, BigInt(1));
      const address = tnft.getAddress();
      await expect(
        tnft.connect(owner).safeTransferFrom(owner.address, address, BigInt(1)),
      ).to.be.revertedWithCustomError(tnft, "ERC721InvalidReceiver");
    });
  });
});
