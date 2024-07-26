// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


contract Tnft is IERC721, Ownable, IERC721Metadata {
    string public constant name = "Tnft";
    string public constant symbol = "TNFT";
    string public constant baseURI = "https://example.com/api/";

    mapping(uint256 tokenId => address owner) private _tokenOwners;
    mapping(address owner => uint256 amount) private _balances;
    mapping(uint256 tokenId => address approved) private _allowances;
    mapping(address owner => mapping(address operator => bool approved)) private _operatorApprovals;

    constructor() Ownable(msg.sender) {}

    error ERC721ExistingToken(uint256 tokenId);

    function balanceOf(address owner) external view override returns (uint256) {
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) external view override returns (address) {
        return _tokenOwners[tokenId];
    }

    function approve(address to, uint256 tokenId) external override {
        address owner = _tokenOwners[tokenId];
        if (owner == address(0)) {
            revert IERC721Errors.ERC721NonexistentToken(tokenId);
        }
        if (owner == to) {
            revert IERC721Errors.ERC721InvalidReceiver(to);
        }
        if (to == address(0)) {
            revert IERC721Errors.ERC721InvalidReceiver(to);
        }
        if (owner != msg.sender && !_operatorApprovals[owner][msg.sender]) {
            revert IERC721Errors.ERC721InvalidOwner(msg.sender);
        }
        _allowances[tokenId] = to;
        emit Approval(msg.sender, to, tokenId);
    }

    function mint(address to, uint256 tokenId) external onlyOwner {
        if (to == address(0)) {
            revert IERC721Errors.ERC721InvalidReceiver(to);
        }
        if (_tokenOwners[tokenId] != address(0)) {
            revert ERC721ExistingToken(tokenId);
        }
        _tokenOwners[tokenId] = to;
        _balances[to] += 1;
        emit Transfer(address(0), to, tokenId);
    }

    function burn(uint256 tokenId) external onlyOwner {
        address owner = _tokenOwners[tokenId];
        if (owner == address(0)) {
            revert IERC721Errors.ERC721NonexistentToken(tokenId);
        }
        _tokenOwners[tokenId] = address(0);
        _balances[owner] -= 1;
        emit Transfer(owner, address(0), tokenId);
    }

    function getApproved(uint256 tokenId) public view override returns (address) {
        return _allowances[tokenId];
    }

    function setApprovalForAll(address operator, bool _approved) external override {
        if (operator == address(0)) {
            revert IERC721Errors.ERC721InvalidOperator(operator);
        }
        if (operator == msg.sender) {
            revert IERC721Errors.ERC721InvalidOperator(msg.sender);
        }
        _operatorApprovals[msg.sender][operator] = _approved;
        emit ApprovalForAll(msg.sender, operator, _approved);
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        if (from == address(0)) {
            revert IERC721Errors.ERC721InvalidSender(from);
        }
        if (to == address(0)) {
            revert IERC721Errors.ERC721InvalidReceiver(to);
        }
        address owner = _tokenOwners[tokenId];
        if (owner == address(0)) {
            revert IERC721Errors.ERC721NonexistentToken(tokenId);
        }
        if (owner != from) {
            revert IERC721Errors.ERC721InvalidOwner(from);
        }
        if (!_isAuthorized(from, msg.sender, tokenId)) {
            revert IERC721Errors.ERC721InsufficientApproval(msg.sender, tokenId);
        }
        _tokenOwners[tokenId] = to;
        _balances[from] -= 1;
        _balances[to] += 1;
        emit Transfer(from, to, tokenId);
    }

    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external override {
        transferFrom(from, to, tokenId);
        _checkOnERC721Received(from, to, tokenId, data);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external override {
        transferFrom(from, to, tokenId);
        _checkOnERC721Received(from, to, tokenId, "");
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC721).interfaceId || interfaceId == type(IERC721Metadata).interfaceId;
    }

    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        if (_tokenOwners[tokenId] == address(0)) {
            revert IERC721Errors.ERC721NonexistentToken(tokenId);
        }
        return string.concat(baseURI, Strings.toString(tokenId));
    }

    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) private {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                if (retval != IERC721Receiver.onERC721Received.selector) {
                    revert IERC721Errors.ERC721InvalidReceiver(to);
                }
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert IERC721Errors.ERC721InvalidReceiver(to);
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        }
    }

    function _isAuthorized(address owner, address spender, uint256 tokenId) internal view virtual returns (bool) {
        return (owner == spender || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }
}
