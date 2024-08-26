// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

abstract contract Permit is ERC20, IERC20Permit {
    string internal constant _EIP_191_PREFIX = "\x19\x01"; // EIP-191 version 1: https://eips.ethereum.org/EIPS/eip-191
    bytes32 internal constant _EIP_712_DOMAIN_TYPE_HASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 public constant PERMIT_TYPEHASH = keccak256(
        "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
    );

    bytes32 private immutable _hashedName;
    bytes32 private immutable _hashedVersion;
    bytes32 private _cachedDomainSeparator;
    string private _name;
    string private _version;

    mapping(address => uint256 nonce) public nonces;

    /**
     * @dev Permit deadline has expired.
     */
    error ERC2612ExpiredSignature(uint256 deadline);

    /**
     * @dev Mismatched signature.
     */
    error ERC2612InvalidSigner(address signer, address owner);

    constructor(string memory name, string memory version) {
        _name = name;
        _version = version;
        _hashedName = keccak256(bytes(name));
        _hashedVersion = keccak256(bytes(version));
        _cachedDomainSeparator = _domainSeparator();
    }

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external virtual {
        if (block.timestamp > deadline) {
            revert ERC2612ExpiredSignature(deadline);
        }

        bytes32 structHash = keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner], deadline));
        bytes32 hash = keccak256(
            abi.encodePacked(
                _EIP_191_PREFIX,
                _cachedDomainSeparator,
                structHash
            )
        );
        address signer = ECDSA.recover(hash, v, r, s);

        if (signer != owner) {
            revert ERC2612InvalidSigner(signer, owner);
        }
        nonces[owner]++;
        _approve(owner, spender, value);
    }

    function DOMAIN_SEPARATOR() external view override returns (bytes32) {
        return _cachedDomainSeparator;
    }

    function _domainSeparator() internal view returns (bytes32) {
        return keccak256(abi.encode(
            _EIP_712_DOMAIN_TYPE_HASH,
            _hashedName,
            _hashedVersion,
            block.chainid,
            address(this)
        ));
    }
}