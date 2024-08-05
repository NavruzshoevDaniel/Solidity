import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

const ZERO_ADDRESS = "0x" + "0".repeat(40);

describe("TGame", function () {
  async function deployTGameFixture() {
    const [owner, account1, account2, account3] = await hre.ethers.getSigners();
    const TGame = await hre.ethers.getContractFactory("TGame");
    const tGame = await TGame.connect(owner).deploy();
    return {
      tGame,
      owner,
      account1,
      account2,
      account3,
    };
  }

  async function deployTGameWithTokenFixture() {
    const [owner, account1, account2, account3] = await hre.ethers.getSigners();
    const TGame = await hre.ethers.getContractFactory("TGame");
    const tGame = await TGame.connect(owner).deploy();
    await tGame.mint(owner.address, 1, 1000);
    await tGame.mint(owner.address, 2, 1000);
    return {
      tGame,
      owner,
      account1,
      account2,
      account3,
    };
  }

  async function deployTGameWithTokenOnMultipleAccountsFixture() {
    const [owner, account1, account2, account3] = await hre.ethers.getSigners();
    const TGame = await hre.ethers.getContractFactory("TGame");
    const tGame = await TGame.connect(owner).deploy();
    await tGame.mint(owner.address, 1, 1000);
    await tGame.mint(account1.address, 1, 1000);
    await tGame.mint(account2.address, 1, 1000);
    await tGame.mint(account3.address, 1, 1000);
    return {
      tGame,
      owner,
      account1,
      account2,
      account3,
    };
  }

  describe("Deployment", function () {
    it("Should set the right initial balance and total supply", async function () {
      const { tGame, owner } = await loadFixture(deployTGameFixture);

      expect(await tGame.balanceOf(owner.address, 1)).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint a token", async function () {
      const { tGame, owner } = await loadFixture(deployTGameFixture);

      await tGame.mint(owner.address, 1, 1);
      expect(await tGame.balanceOf(owner.address, 1)).to.equal(1);
    });

    it("Should mint multiple tokens", async function () {
      const { tGame, owner } = await loadFixture(deployTGameFixture);

      await tGame.mint(owner.address, 1, 1);
      await tGame.mint(owner.address, 1, 2);
      expect(await tGame.balanceOf(owner.address, 1)).to.equal(3);
    });

    it("Should mint multiple tokens with different ids", async function () {
      const { tGame, owner } = await loadFixture(deployTGameFixture);

      await tGame.mint(owner.address, 1, 1);
      await tGame.mint(owner.address, 2, 1);
      expect(await tGame.balanceOf(owner.address, 1)).to.equal(1);
      expect(await tGame.balanceOf(owner.address, 2)).to.equal(1);
    });

    it("Should mint a token and emit event", async function () {
      const { tGame, owner } = await loadFixture(deployTGameFixture);

      await expect(tGame.mint(owner.address, 1, 1))
        .to.emit(tGame, "TransferSingle")
        .withArgs(owner.address, ZERO_ADDRESS, owner.address, 1, 1);
    });

    it("Should revert ERC1155InvalidReceiver when address receiver has zero address", async function () {
      const { tGame } = await loadFixture(deployTGameFixture);

      await expect(tGame.mint(ZERO_ADDRESS, 1, 1)).to.be.revertedWithCustomError(
        tGame,
        "ERC1155InvalidReceiver",
      );
    });
  });

  describe("Minting batch", function () {
    it("Should mint a batch of tokens", async function () {
      const { tGame, owner } = await loadFixture(deployTGameFixture);

      await tGame.mintBatch(owner.address, [1, 2], [1, 1]);
      expect(await tGame.balanceOf(owner.address, 1)).to.equal(1);
      expect(await tGame.balanceOf(owner.address, 2)).to.equal(1);
    });

    it("Should mint a batch of tokens and emit event", async function () {
      const { tGame, owner } = await loadFixture(deployTGameFixture);

      await expect(tGame.mintBatch(owner.address, [1, 2], [1, 1]))
        .to.emit(tGame, "TransferBatch")
        .withArgs(owner.address, ZERO_ADDRESS, owner.address, [1, 2], [1, 1]);
    });

    it("Should revert ERC1155InvalidReceiver when address receiver has zero address", async function () {
      const { tGame } = await loadFixture(deployTGameFixture);

      await expect(tGame.mintBatch(ZERO_ADDRESS, [1, 2], [1, 1])).to.be.revertedWithCustomError(
        tGame,
        "ERC1155InvalidReceiver",
      );
    });

    it("Should revert ERC1155InvalidArrayLength when arrays have different lengths", async function () {
      const { tGame, owner } = await loadFixture(deployTGameFixture);

      await expect(tGame.mintBatch(owner.address, [1, 1], [1])).to.be.revertedWithCustomError(
        tGame,
        "ERC1155InvalidArrayLength",
      );
    });
  });

  describe("Burning", function () {
    it("Should burn a token", async function () {
      const { tGame, owner } = await loadFixture(deployTGameWithTokenFixture);

      await tGame.burn(owner.address, 1, 1);
      expect(await tGame.balanceOf(owner.address, 1)).to.equal(999);
    });

    it("Should burn multiple tokens", async function () {
      const { tGame, owner } = await loadFixture(deployTGameWithTokenFixture);

      await tGame.burn(owner.address, 1, 1);
      await tGame.burn(owner.address, 1, 2);
      expect(await tGame.balanceOf(owner.address, 1)).to.equal(997);
    });

    it("Should burn multiple tokens with different ids", async function () {
      const { tGame, owner } = await loadFixture(deployTGameWithTokenFixture);

      await tGame.burn(owner.address, 1, 1);
      await tGame.burn(owner.address, 2, 1);
      expect(await tGame.balanceOf(owner.address, 1)).to.equal(999);
      expect(await tGame.balanceOf(owner.address, 2)).to.equal(999);
    });

    it("Should burn a token and emit event", async function () {
      const { tGame, owner } = await loadFixture(deployTGameWithTokenFixture);

      await expect(tGame.burn(owner.address, 1, 1))
        .to.emit(tGame, "TransferSingle")
        .withArgs(owner.address, owner.address, ZERO_ADDRESS, 1, 1);
    });

    it("Should revert ERC1155InvalidSender when address receiver has zero address", async function () {
      const { tGame } = await loadFixture(deployTGameFixture);

      await expect(tGame.burn(ZERO_ADDRESS, 1, 1)).to.be.revertedWithCustomError(
        tGame,
        "ERC1155InvalidSender",
      );
    });

    it("Should revert ERC1155InsufficientBalance when balance is insufficient", async function () {
      const { tGame, owner } = await loadFixture(deployTGameWithTokenFixture);

      await expect(tGame.burn(owner.address, 1, 1001)).to.be.revertedWithCustomError(
        tGame,
        "ERC1155InsufficientBalance",
      );
    });

    it("Should revert ERC1155InsufficientBalance when token does not exist", async function () {
      const { tGame, owner } = await loadFixture(deployTGameWithTokenFixture);

      await expect(tGame.burn(owner.address, 3, 1)).to.be.revertedWithCustomError(
        tGame,
        "ERC1155InsufficientBalance",
      );
    });
  });

  describe("Burning batch", function () {
    it("Should burn a batch of tokens", async function () {
      const { tGame, owner } = await loadFixture(deployTGameWithTokenFixture);

      await tGame.burnBatch(owner.address, [1, 2], [1, 1]);
      expect(await tGame.balanceOf(owner.address, 1)).to.equal(999);
      expect(await tGame.balanceOf(owner.address, 2)).to.equal(999);
    });

    it("Should burn a batch of tokens and emit event", async function () {
      const { tGame, owner } = await loadFixture(deployTGameWithTokenFixture);

      await expect(tGame.burnBatch(owner.address, [1, 2], [1, 1]))
        .to.emit(tGame, "TransferBatch")
        .withArgs(owner.address, owner.address, ZERO_ADDRESS, [1, 2], [1, 1]);
    });

    it("Should revert ERC1155InvalidSender when address receiver has zero address", async function () {
      const { tGame } = await loadFixture(deployTGameFixture);

      await expect(tGame.burnBatch(ZERO_ADDRESS, [1, 2], [1, 1])).to.be.revertedWithCustomError(
        tGame,
        "ERC1155InvalidSender",
      );
    });

    it("Should revert ERC1155InsufficientBalance when balance is insufficient", async function () {
      const { tGame, owner } = await loadFixture(deployTGameWithTokenFixture);

      await expect(tGame.burnBatch(owner.address, [1, 2], [1001, 1])).to.be.revertedWithCustomError(
        tGame,
        "ERC1155InsufficientBalance",
      );
    });

    it("Should burn a batch of tokens on multiple accounts", async function () {
      const { tGame, owner, account1 } = await loadFixture(
        deployTGameWithTokenOnMultipleAccountsFixture,
      );

      await tGame.burnBatch(owner.address, [1], [1]);
      await tGame.burnBatch(account1.address, [1], [1]);
      expect(await tGame.balanceOf(owner.address, 1)).to.equal(999);
      expect(await tGame.balanceOf(account1.address, 1)).to.equal(999);
    });

    it("Should revert ERC1155InvalidBatch when arrays have different lengths", async function () {
      const { tGame, owner } = await loadFixture(deployTGameWithTokenFixture);

      await expect(tGame.burnBatch(owner.address, [1, 1], [1])).to.be.revertedWithCustomError(
        tGame,
        "ERC1155InvalidArrayLength",
      );
    });
  });

  describe("ApproveForAll", function () {
    it("Should approve for all", async function () {
      const { tGame, owner, account1 } = await loadFixture(deployTGameFixture);

      await tGame.setApprovalForAll(account1.address, true);
      expect(await tGame.isApprovedForAll(owner.address, account1.address)).to.equal(true);
    });

    it("Should approve for all and emit event", async function () {
      const { tGame, owner, account1 } = await loadFixture(deployTGameFixture);

      await expect(tGame.setApprovalForAll(account1.address, true))
        .to.emit(tGame, "ApprovalForAll")
        .withArgs(owner.address, account1.address, true);
    });

    it("Should revert ERC1155InvalidOperator when operator has zero address", async function () {
      const { tGame } = await loadFixture(deployTGameFixture);

      await expect(tGame.setApprovalForAll(ZERO_ADDRESS, true)).to.be.revertedWithCustomError(
        tGame,
        "ERC1155InvalidOperator",
      );
    });

    it("Should revert ERC1155InvalidOperator when operator is owner", async function () {
      const { tGame, owner } = await loadFixture(deployTGameFixture);

      await expect(tGame.setApprovalForAll(owner.address, true)).to.be.revertedWithCustomError(
        tGame,
        "ERC1155InvalidOperator",
      );
    });
  });

  describe("SafeTransferFrom", function () {
    it("Should transfer a token", async function () {
      const { tGame, owner, account1 } = await loadFixture(deployTGameWithTokenFixture);

      await tGame.safeTransferFrom(owner.address, account1.address, 1, 1, "0x");
      expect(await tGame.balanceOf(owner.address, 1)).to.equal(999);
      expect(await tGame.balanceOf(account1.address, 1)).to.equal(1);
    });

    it("Should transfer a token and emit event", async function () {
      const { tGame, owner, account1 } = await loadFixture(deployTGameWithTokenFixture);

      await expect(tGame.safeTransferFrom(owner.address, account1.address, 1, 1, "0x"))
        .to.emit(tGame, "TransferSingle")
        .withArgs(owner.address, owner.address, account1.address, 1, 1);
    });

    it("Should revert ERC1155InvalidSender when address sender has zero address", async function () {
      const { tGame, account1 } = await loadFixture(deployTGameFixture);

      await expect(
        tGame.safeTransferFrom(ZERO_ADDRESS, account1.address, 1, 1, "0x"),
      ).to.be.revertedWithCustomError(tGame, "ERC1155InvalidSender");
    });

    it("Should revert ERC1155InvalidReceiver when address receiver has zero address", async function () {
      const { tGame, owner } = await loadFixture(deployTGameWithTokenFixture);

      await expect(
        tGame.safeTransferFrom(owner.address, ZERO_ADDRESS, 1, 1, "0x"),
      ).to.be.revertedWithCustomError(tGame, "ERC1155InvalidReceiver");
    });

    it("Should revert ERC1155InsufficientBalance when balance is insufficient", async function () {
      const { tGame, owner, account1 } = await loadFixture(deployTGameWithTokenFixture);

      await expect(
        tGame.safeTransferFrom(owner.address, account1.address, 1, 1001, "0x"),
      ).to.be.revertedWithCustomError(tGame, "ERC1155InsufficientBalance");
    });

    it("Should revert ERC1155MissingApprovalForAll when operator is not approved for all", async function () {
      const { tGame, owner, account1 } = await loadFixture(deployTGameWithTokenFixture);

      await expect(
        tGame.connect(account1).safeTransferFrom(owner.address, account1.address, 1, 1, "0x"),
      ).to.be.revertedWithCustomError(tGame, "ERC1155MissingApprovalForAll");
    });

    it("Should transfer a token when operator is approved for all", async function () {
      const { tGame, owner, account1 } = await loadFixture(deployTGameWithTokenFixture);

      await tGame.setApprovalForAll(account1.address, true);
      await tGame.connect(account1).safeTransferFrom(owner.address, account1.address, 1, 1, "0x");
      expect(await tGame.balanceOf(owner.address, 1)).to.equal(999);
      expect(await tGame.balanceOf(account1.address, 1)).to.equal(1);
    });

    it("Should pass when operator transfer to himself", async function () {
      const { tGame, owner } = await loadFixture(deployTGameWithTokenFixture);

      await expect(tGame.safeTransferFrom(owner.address, owner.address, 1, 1, "0x")).to.be.not
        .reverted;
      expect(await tGame.balanceOf(owner.address, 1)).to.be.equal(1000);
    });

    it("Should revert ERC1155InvalidReceiver when receiver address doesnt implement onERC1155Received", async function () {
      const { tGame, owner } = await loadFixture(deployTGameWithTokenFixture);

      await expect(
        tGame.safeTransferFrom(owner.address, tGame.getAddress(), 1, 1, "0x"),
      ).to.be.revertedWithCustomError(tGame, "ERC1155InvalidReceiver");
    });
  });

  describe("SafeBatchTransferFrom", function () {
    it("Should transfer a batch of tokens", async function () {
      const { tGame, owner, account1 } = await loadFixture(deployTGameWithTokenFixture);

      await tGame.safeBatchTransferFrom(owner.address, account1.address, [1, 2], [1, 1], "0x");
      expect(await tGame.balanceOf(owner.address, 1)).to.equal(999);
      expect(await tGame.balanceOf(owner.address, 2)).to.equal(999);
      expect(await tGame.balanceOf(account1.address, 1)).to.equal(1);
      expect(await tGame.balanceOf(account1.address, 2)).to.equal(1);
    });

    it("Should transfer a batch of tokens and emit event", async function () {
      const { tGame, owner, account1 } = await loadFixture(deployTGameWithTokenFixture);

      await expect(
        tGame.safeBatchTransferFrom(owner.address, account1.address, [1, 2], [1, 1], "0x"),
      )
        .to.emit(tGame, "TransferBatch")
        .withArgs(owner.address, owner.address, account1.address, [1, 2], [1, 1]);
    });

    it("Should revert ERC1155InvalidSender when address sender has zero address", async function () {
      const { tGame, account1 } = await loadFixture(deployTGameFixture);

      await expect(
        tGame.safeBatchTransferFrom(ZERO_ADDRESS, account1.address, [1, 2], [1, 1], "0x"),
      ).to.be.revertedWithCustomError(tGame, "ERC1155InvalidSender");
    });

    it("Should revert ERC1155InvalidReceiver when address receiver has zero address", async function () {
      const { tGame, owner } = await loadFixture(deployTGameWithTokenFixture);

      await expect(
        tGame.safeBatchTransferFrom(owner.address, ZERO_ADDRESS, [1, 2], [1, 1], "0x"),
      ).to.be.revertedWithCustomError(tGame, "ERC1155InvalidReceiver");
    });

    it("Should revert ERC1155InsufficientBalance when balance is insufficient", async function () {
      const { tGame, owner, account1 } = await loadFixture(deployTGameWithTokenFixture);

      await expect(
        tGame.safeBatchTransferFrom(owner.address, account1.address, [1, 2], [1001, 1], "0x"),
      ).to.be.revertedWithCustomError(tGame, "ERC1155InsufficientBalance");
    });

    it("Should revert ERC1155InsufficientBalance when balance is insufficient on second token", async function () {
      const { tGame, owner, account1 } = await loadFixture(deployTGameWithTokenFixture);

      await expect(
        tGame.safeBatchTransferFrom(owner.address, account1.address, [1, 2], [1, 1001], "0x"),
      ).to.be.revertedWithCustomError(tGame, "ERC1155InsufficientBalance");
    });

    it("Should revert ERC1155MissingApprovalForAll when operator is not approved for all", async function () {
      const { tGame, owner, account1 } = await loadFixture(deployTGameWithTokenFixture);

      await expect(
        tGame
          .connect(account1)
          .safeBatchTransferFrom(owner.address, account1.address, [1, 2], [1, 1], "0x"),
      ).to.be.revertedWithCustomError(tGame, "ERC1155MissingApprovalForAll");
    });

    it("Should transfer a batch of tokens when operator is approved for all", async function () {
      const { tGame, owner, account1 } = await loadFixture(deployTGameWithTokenFixture);

      await tGame.setApprovalForAll(account1.address, true);
      await tGame
        .connect(account1)
        .safeBatchTransferFrom(owner.address, account1.address, [1, 2], [1, 1], "0x");
      expect(await tGame.balanceOf(owner.address, 1)).to.equal(999);
      expect(await tGame.balanceOf(owner.address, 2)).to.equal(999);
      expect(await tGame.balanceOf(account1.address, 1)).to.equal(1);
      expect(await tGame.balanceOf(account1.address, 2)).to.equal(1);
    });

    it("Should pass when operator transfer to himself", async function () {
      const { tGame, owner } = await loadFixture(deployTGameWithTokenFixture);

      await expect(tGame.safeBatchTransferFrom(owner.address, owner.address, [1, 2], [1, 1], "0x"))
        .to.be.not.reverted;
      expect(await tGame.balanceOf(owner.address, 1)).to.be.equal(1000);
      expect(await tGame.balanceOf(owner.address, 2)).to.be.equal(1000);
    });

    it("Should revert ERC1155InvalidReceiver when receiver address doesnt implement onERC1155BatchReceived", async function () {
      const { tGame, owner } = await loadFixture(deployTGameWithTokenFixture);

      await expect(
        tGame.safeBatchTransferFrom(owner.address, tGame.getAddress(), [1, 2], [1, 1], "0x"),
      ).to.be.revertedWithCustomError(tGame, "ERC1155InvalidReceiver");
    });

    it("Should revert ERC1155InvalidArrayLength when arrays have different lengths", async function () {
      const { tGame, owner, account1 } = await loadFixture(deployTGameWithTokenFixture);

      await expect(
        tGame.safeBatchTransferFrom(owner.address, account1.address, [1, 1], [1], "0x"),
      ).to.be.revertedWithCustomError(tGame, "ERC1155InvalidArrayLength");
    });
  });

  describe("URI", function () {
    it("Should return the right URI", async function () {
      const { tGame } = await loadFixture(deployTGameFixture);

      expect(await tGame.uri(1)).to.equal("https://example.com/api/1");
    });

    it("Should return the right URI for a batch", async function () {
      const { tGame } = await loadFixture(deployTGameFixture);

      expect(await tGame.uri(1)).to.equal("https://example.com/api/1");
      expect(await tGame.uri(2)).to.equal("https://example.com/api/2");
    });

    it("Should return the right URI for a batch", async function () {
      const { tGame } = await loadFixture(deployTGameFixture);

      expect(await tGame.uri(1)).to.equal("https://example.com/api/1");
      expect(await tGame.uri(2)).to.equal("https://example.com/api/2");
    });
  });

  describe("BalanceOfBatch", function () {
    it("Should return the right balance for a batch", async function () {
      const { tGame, owner, account1 } = await loadFixture(deployTGameWithTokenFixture);

      expect(await tGame.balanceOfBatch([owner.address, account1.address], [1, 2])).to.deep.equal([
        1000, 0,
      ]);
    });

    it("Should return the right balance for a batch", async function () {
      const { tGame, owner, account1 } = await loadFixture(
        deployTGameWithTokenOnMultipleAccountsFixture,
      );

      expect(await tGame.balanceOfBatch([owner.address, account1.address], [1, 1])).to.deep.equal([
        1000, 1000,
      ]);
    });

    it("Should revert ERC1155InvalidBatch when arrays have different lengths", async function () {
      const { tGame, owner, account1 } = await loadFixture(deployTGameWithTokenFixture);

      await expect(
        tGame.balanceOfBatch([owner.address, account1.address], [1]),
      ).to.be.revertedWithCustomError(tGame, "ERC1155InvalidArrayLength");
    });
  });

  describe("SupportsInterface", async function () {
    it("Should return true for ERC165 interface", async function () {
      const { tGame } = await loadFixture(deployTGameFixture);

      expect(await tGame.supportsInterface("0x01ffc9a7")).to.be.true;
    });

    it("Should return true for ERC1155 interface", async function () {
      const { tGame } = await loadFixture(deployTGameFixture);

      expect(await tGame.supportsInterface("0xd9b67a26")).to.be.true;
    });

    it("Should return true for ERC1155MetadataURI interface", async function () {
      const { tGame } = await loadFixture(deployTGameFixture);

      expect(await tGame.supportsInterface("0x0e89341c")).to.be.true;
    });
  });
});
