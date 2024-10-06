// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract RandomizerOracle is VRFConsumerBaseV2Plus {
    IVRFCoordinatorV2Plus immutable COORDINATOR;

    uint256 subscriptionId;
    bytes32 keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 numWords = 1;
    uint16 requestConfirmations = 3;
    uint32 callbackGasLimit = 100000;
    uint256[] public requestIds;
    mapping(uint256 requestId => RequestStatus) s_requests;
    uint256 public latestRequestId;

    struct RequestStatus {
        bool isFulfilled;
        bool exists;
        uint256[] randomWords;
    }

    event RequestSent(uint256 requestId, uint32 numWords);
    event RequestFulfilled(uint256 requestId, uint256[] randomWords);

    constructor(uint256 _subscriptionId, address _vrfCoordinator) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        COORDINATOR = IVRFCoordinatorV2Plus(_vrfCoordinator);
        subscriptionId = _subscriptionId;
    }

    function getRandomNumber() external returns (uint256) {
        uint256 requestId = COORDINATOR.requestRandomWords(VRFV2PlusClient.RandomWordsRequest({
            keyHash: keyHash,
            subId: subscriptionId,
            requestConfirmations: requestConfirmations,
            callbackGasLimit: callbackGasLimit,
            numWords: numWords,
            extraArgs: ""
        }));
        requestIds.push(requestId);
        latestRequestId = requestId;
        s_requests[requestId] = RequestStatus({
            isFulfilled: false,
            exists: true,
            randomWords: new uint256[](numWords)
        });
        emit RequestSent(requestId, numWords);
        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        require(s_requests[requestId].exists, "Request does not exist");
        require(!s_requests[requestId].isFulfilled, "Request already fulfilled");
        s_requests[requestId].randomWords = randomWords;
        s_requests[requestId].isFulfilled = true;
        emit RequestFulfilled(requestId, randomWords);
    }

    function getRequestStatus(uint256 _requestId) external view returns (bool fulfilled, uint256[] memory randomWords) {
        require(s_requests[_requestId].exists, "request not found");
        RequestStatus memory request = s_requests[_requestId];
        return (request.isFulfilled, request.randomWords);
    }
}