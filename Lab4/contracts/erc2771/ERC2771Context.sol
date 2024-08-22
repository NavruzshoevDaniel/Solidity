pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Context.sol";

abstract contract ERC2771Context is Context {
    address public immutable trustedForwarder;

    constructor(address _trustedForwarder) {
        trustedForwarder = _trustedForwarder;
    }

    function isTrustedForwarder(address forwarder) public view virtual returns (bool) {
        return forwarder == trustedForwarder;
    }

    function _msgSender() internal view virtual override returns (address) {
        uint256 calldataLength = msg.data.length;
        uint256 contextSuffixLength = _contextSuffixLength();
        if (isTrustedForwarder(msg.sender) && calldataLength >= contextSuffixLength) {
            return address(bytes20(msg.data[calldataLength - contextSuffixLength :]));
        } else {
            return super._msgSender();
        }
    }

    function _msgData() internal view virtual override returns (bytes calldata) {
        uint256 calldataLength = msg.data.length;
        uint256 contextSuffixLength = _contextSuffixLength();
        if (isTrustedForwarder(msg.sender) && calldataLength >= contextSuffixLength) {
            return msg.data[: calldataLength - contextSuffixLength];
        } else {
            return super._msgData();
        }
    }

    function _contextSuffixLength() internal view virtual override returns (uint256) {
        return 20;
    }
}