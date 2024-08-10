import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("InventoryManager", function () {
  async function deployInventoryManagerFixture() {
    const InventoryManager = await hre.ethers.getContractFactory("InventoryManager");
    const [owner, account1, account2] = await hre.ethers.getSigners();
    const inventoryManager = await InventoryManager.connect(owner).deploy(10);

    return {
      inventoryManager,
      owner,
      account1,
      account2,
    };
  }

  it("should add an item", async function () {
    const { inventoryManager, owner } = await loadFixture(deployInventoryManagerFixture);
    await inventoryManager.addItem("Item 1", 5);

    const item = await inventoryManager.getItem(0);
    expect(item.itemId).to.equal(0);
    expect(item.name).to.equal("Item 1");
    expect(item.quantity).to.equal(5);
    expect(item.isAvailable).to.be.equal(true);
    expect(item.owner).to.equal(owner.address);
  });

  it("should not add an item if quantity exceeds max limit", async function () {
    const { inventoryManager } = await loadFixture(deployInventoryManagerFixture);
    await expect(inventoryManager.addItem("Item 2", 15)).to.be.revertedWith(
      "Quantity exceeds maximum item quantity.",
    );
  });

  it("should revert if item does not exist", async function () {
    const { inventoryManager } = await loadFixture(deployInventoryManagerFixture);
    await expect(inventoryManager.getItem(0)).to.be.revertedWith("Item does not exist.");
  });
});
