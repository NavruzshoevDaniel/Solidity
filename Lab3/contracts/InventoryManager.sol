// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract InventoryManager {

    uint32 public maxItemQuantity;
    bool public isInventoryTrackingEnabled = true;
    uint32 public createdAt = uint32(block.timestamp);

    struct Item {
        uint32 itemId;
        uint32 quantity;
        bool isAvailable;
        uint32 lastUpdated;
        address owner;
        string name;
    }

    Item[] public inventory;

    constructor(uint32 _maxItemQuantity) {
        maxItemQuantity = _maxItemQuantity;
    }

    function addItem(string memory _name, uint32 _quantity) public {
        require(_quantity <= maxItemQuantity, "Quantity exceeds maximum item quantity.");
        inventory.push(Item({
            itemId: uint32(inventory.length),
            name: _name,
            quantity: _quantity,
            isAvailable: true,
            lastUpdated:uint32(block.timestamp),
            owner: msg.sender
        }));
    }

    function getItem(uint32 _itemId) public view returns (Item memory) {
        require(_itemId < inventory.length, "Item does not exist.");
        return inventory[_itemId];
    }
}
