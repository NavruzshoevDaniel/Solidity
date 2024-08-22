// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/interfaces/IERC5267.sol";


contract ERC2771Forwarder is IERC5267 {
    string internal constant _EIP_191_PREFIX = "\x19\x01"; // EIP-191 version 1: https://eips.ethereum.org/EIPS/eip-191
    bytes32 internal constant _EIP_712_DOMAIN_TYPE_HASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 internal constant _FORWARD_REQUEST_TYPEHASH = keccak256(
        "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,uint48 deadline,bytes data)"
    );

    bytes32 private immutable _hashedName;
    bytes32 private immutable _hashedVersion;
    bytes32 private _cachedDomainSeparator;
    string private _name;
    string private _version;

    mapping(address => uint256 nonce) public nonces;

    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint48 deadline;
        bytes data;
        bytes signature;
    }

    constructor(
        string memory name,
        string memory version
    ) {
        _name = name;
        _version = version;
        _hashedName = keccak256(bytes(name));
        _hashedVersion = keccak256(bytes(version));
        _cachedDomainSeparator = _domainSeparator();
    }

    function verify(ForwardRequest calldata req) external view returns (address) {
        //if (block.timestamp > req.deadline) return false;
        bytes32 structMessageHash = keccak256(
            abi.encode(
                _FORWARD_REQUEST_TYPEHASH,
                req.from,
                req.to,
                req.value,
                req.gas,
                nonces[req.from],
                req.deadline,
                keccak256(req.data)
            )
        );
        bytes32 hash = keccak256(abi.encodePacked(
            _EIP_191_PREFIX,
            _cachedDomainSeparator, // EIP-712
            structMessageHash
        ));

        return ECDSA.recover(hash, req.signature);
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

    function eip712Domain() public view virtual override returns (
        bytes1 fields,
        string memory name,
        string memory version,
        uint256 chainId,
        address verifyingContract,
        bytes32 salt,
        uint256[] memory extensions
    ) {
        fields = hex"0f"; // 01111 bit-mask: name, version, chainId, verifyingContract
        name = _name;
        version = _version;
        chainId = block.chainid;
        verifyingContract = address(this);
        salt = 0;
        extensions = new uint256[](0);
    }
}