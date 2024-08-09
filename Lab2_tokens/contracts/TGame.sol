// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IERC1155Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";


contract TGame is IERC1155, Ownable, IERC1155MetadataURI {
    string public constant baseURI = "https://example.com/api/";

    mapping(uint32 tokenId => mapping(address owner => uint256 amount)) private _balances;
    mapping(address owner => mapping(address operator => bool approved)) private _operatorApprovals;

    constructor() Ownable(msg.sender) {}

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC1155).interfaceId ||
        interfaceId == type(IERC1155MetadataURI).interfaceId || type(IERC165).interfaceId == interfaceId;
    }

    function uri(uint256 id) external pure override returns (string memory) {
        return string.concat(baseURI, Strings.toString(id));
    }

    function mint(address to, uint256 id, uint256 amount) external onlyOwner {
        if (to == address(0)) {
            revert IERC1155Errors.ERC1155InvalidReceiver(to);
        }
        _balances[id][to] += amount;
        emit TransferSingle(msg.sender, address(0), to, id, amount);
    }

    function mintBatch(address to, uint256[] calldata ids, uint256[] calldata amounts) external onlyOwner {
        uint256 idsLength = ids.length;
        if (idsLength != amounts.length) {
            revert IERC1155Errors.ERC1155InvalidArrayLength(idsLength, amounts.length);
        }
        if (to == address(0)) {
            revert IERC1155Errors.ERC1155InvalidReceiver(to);
        }
        for (uint256 i = 0; i < idsLength; ++i) {
            _balances[ids[i]][to] += amounts[i];
        }
        emit TransferBatch(msg.sender, address(0), to, ids, amounts);
    }

    function burn(address from, uint256 id, uint256 amount) external onlyOwner {
        if (from == address(0)) {
            revert IERC1155Errors.ERC1155InvalidSender(from);
        }
        uint256 balance = _balances[id][from];
        if (balance < amount) {
            revert IERC1155Errors.ERC1155InsufficientBalance(from, balance, amount, id);
        }
        unchecked {
            // can safely assume that balance is greater than amount cause of the above check
            _balances[id][from] = balance - amount;
        }
        emit TransferSingle(msg.sender, from, address(0), id, amount);
    }

    function burnBatch(address from, uint256[] calldata ids, uint256[] calldata amounts) external onlyOwner {
        uint256 idsLength = ids.length;
        if (idsLength != amounts.length) {
            revert IERC1155Errors.ERC1155InvalidArrayLength(idsLength, amounts.length);
        }
        if (from == address(0)) {
            revert IERC1155Errors.ERC1155InvalidSender(from);
        }
        for (uint256 i = 0; i < idsLength; ++i) {
            uint256 id = ids[i];
            uint256 balance = _balances[id][from];
            uint256 amount = amounts[i];
            if (balance < amount) {
                revert IERC1155Errors.ERC1155InsufficientBalance(from, balance, amount, id);
            }
            unchecked {
                // can safely assume that balance is greater than amount cause of the above check
                _balances[id][from] = balance - amount;
            }
        }
        emit TransferBatch(msg.sender, from, address(0), ids, amounts);
    }


    function balanceOf(address account, uint256 id) external view override returns (uint256) {
        return _balances[id][account];
    }

    function balanceOfBatch(
        address[] calldata accounts,
        uint256[] calldata ids
    ) external view override returns (uint256[] memory) {
        uint256 length = accounts.length;
        if (length != ids.length) {
            revert IERC1155Errors.ERC1155InvalidArrayLength(ids.length, length);
        }
        uint256[] memory batchBalances = new uint256[](length);
        for (uint256 i = 0; i < length; ++i) {
            batchBalances[i] = _balances[ids[i]][accounts[i]];
        }
        return batchBalances;
    }

    function setApprovalForAll(address operator, bool _approved) external override {
        if (operator == address(0)) {
            revert IERC1155Errors.ERC1155InvalidOperator(operator);
        }
        if (operator == msg.sender) {
            revert IERC1155Errors.ERC1155InvalidOperator(msg.sender);
        }
        _operatorApprovals[msg.sender][operator] = _approved;
        emit ApprovalForAll(msg.sender, operator, _approved);
    }

    function isApprovedForAll(address account, address operator) public view override returns (bool) {
        return _operatorApprovals[account][operator];
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external override {
        if (from == address(0)) {
            revert IERC1155Errors.ERC1155InvalidSender(from);
        }
        if (to == address(0)) {
            revert IERC1155Errors.ERC1155InvalidReceiver(to);
        }
        _transferFrom(from, to, id, amount);
        emit TransferSingle(msg.sender, from, to, id, amount);
        _checkOnERC1155Received(from, to, id, amount, data);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external override {
        uint256 idsLength = ids.length;
        if (idsLength != amounts.length) {
            revert IERC1155Errors.ERC1155InvalidArrayLength(idsLength, amounts.length);
        }
        if (from == address(0)) {
            revert IERC1155Errors.ERC1155InvalidSender(from);
        }
        if (to == address(0)) {
            revert IERC1155Errors.ERC1155InvalidReceiver(to);
        }
        for (uint256 i = 0; i < idsLength; ++i) {
            _transferFrom(from, to, ids[i], amounts[i]);
        }
        emit TransferBatch(msg.sender, from, to, ids, amounts);
        _checkOnERC1155BatchReceived(from, to, ids, amounts, data);
    }

    function _transferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount
    ) private {
        uint256 balance = _balances[id][from];
        if (balance < amount) {
            revert IERC1155Errors.ERC1155InsufficientBalance(from, balance, amount, id);
        }
        if (!_isAuthorized(from, msg.sender)) {
            revert IERC1155Errors.ERC1155MissingApprovalForAll(msg.sender, from);
        }
        unchecked {
            // can safely assume that balance is greater than amount cause of the above check
            _balances[id][from] = balance - amount;
        }
        _balances[id][to] += amount;
    }

    function _checkOnERC1155Received(
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) private {
        if (to.code.length > 0) {
            try IERC1155Receiver(to).onERC1155Received(msg.sender, from, id, value, data) returns (bytes4 retval) {
                if (retval != IERC1155Receiver.onERC1155Received.selector) {
                    revert IERC1155Errors.ERC1155InvalidReceiver(to);
                }
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert IERC1155Errors.ERC1155InvalidReceiver(to);
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        }
    }

    function _checkOnERC1155BatchReceived(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) private {
        if (to.code.length > 0) {
            try IERC1155Receiver(to).onERC1155BatchReceived(
                msg.sender, from, ids, amounts, data
            ) returns (bytes4 retval) {
                if (retval != IERC1155Receiver.onERC1155BatchReceived.selector) {
                    revert IERC1155Errors.ERC1155InvalidReceiver(to);
                }
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert IERC1155Errors.ERC1155InvalidReceiver(to);
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        }
    }

    function _isAuthorized(address owner, address spender) internal view virtual returns (bool) {
        return (owner == spender || _operatorApprovals[owner][spender]);
    }
}
