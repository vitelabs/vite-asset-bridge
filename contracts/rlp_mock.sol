pragma solidity ^0.6.3;
pragma experimental ABIEncoderV2; // todo delete

import "./rlp.sol";

contract RLP2{
    // every four hours
    function verifyHeader(bytes32 _hash, bytes[] memory _headers) public pure {
        require(keccak256(RLPEncoder.encodeList(_headers)) == _hash, "hash verified");
    }
}

contract RLP1 {
    struct Header {
        bytes parentHash;
        bytes sha3Uncles;
        bytes miner;
        bytes stateRoot;
        bytes transactionsRoot;
        bytes receiptsRoot;
        bytes logsBloom;
        bytes difficulty;
        bytes number;
        bytes gasLimit;
        bytes gasUsed;
        bytes timestamp;
        bytes extraData;
        bytes mixHash;
        bytes nonce;
        bytes raw;
    }

    bytes public raw;
    bytes32 public headerHash;

    function verifyHeader(bytes32 _hash, Header memory _header) public {
        packed0(_header);
        packed1(_header);
        packed2(_header);
        raw = encodeRaw(_header.raw);
        headerHash = keccak256(raw);
        require(keccak256(encodeRaw(_header.raw)) == _hash, "hash verified");
    }

    function packed0(Header memory _header) internal pure {
        _header.raw = abi.encodePacked(
            _header.raw,
            encodeBytes(_header.parentHash),
            encodeBytes(_header.sha3Uncles),
            encodeBytes(_header.miner),
            encodeBytes(_header.stateRoot)
        );
    }

    function packed1(Header memory _header) internal pure {
        _header.raw = abi.encodePacked(
            _header.raw,
            encodeBytes(_header.transactionsRoot),
            encodeBytes(_header.receiptsRoot),
            encodeBytes(_header.logsBloom),
            encodeBytes(_header.difficulty)
        );
    }

    function packed2(Header memory _header) internal pure {
        _header.raw = abi.encodePacked(
            _header.raw,
            encodeBytes(_header.number),
            encodeBytes(_header.gasLimit),
            encodeBytes(_header.gasUsed),
            encodeBytes(_header.timestamp),
            encodeBytes(_header.extraData),
            encodeBytes(_header.mixHash),
            encodeBytes(_header.nonce)
        );
    }

    function encodeRaw(bytes memory _raw) internal pure returns (bytes memory) {
        return abi.encodePacked(RLPEncoder.encodeLength(_raw.length, 192), _raw);
    }
    
    function encodeBytes(bytes memory _raw) internal pure returns (bytes memory) {
        return RLPEncoder.encodeBytes(_raw);
    }
}
