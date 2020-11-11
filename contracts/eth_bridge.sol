pragma solidity ^0.6.3;
pragma experimental ABIEncoderV2;

import "./rlp.sol";

contract EthBridge {
    // the latest confirmed header
    ethHeader public latest;
    // all confirmed header, and these can be used as proof
    mapping(uint256 => ethHeader) public history;

    // all pending headers, and headers with height less than the latest height will be deleted
    // mapping(uint256 => ethHeader[]) unconfirmed;

    mapping(uint256 => mapping(bytes32 => ethHeader)) public unconfirmed;

    // any header less than this difficulty will not be submitted successfully
    uint256 public leastDifficulty;
    uint256 public maxDifficulty;

    // confirmed num
    uint256 public confirmedThreshold;

    struct ethHeader {
        uint256 height;
        bytes32 headerHash;
        bytes32 parentHash;
        uint256 totalDifficulty;
        bytes32 receiptRoot;
    }

    ethHeader tmp;

    constructor() public {}

    // todo  init -> constructor
    function init(
        uint256 _leastDifficulty,
        uint256 _totalDifficulty,
        uint256 _confirmedThreshold,
        bytes32 _hash,
        bytes[] memory _headers
    ) public {
        verifyHeader(_hash, _headers);

        uint256 _height = bytesToUint256(_headers[8]);
        bytes32 _parentHash = bytesToBytes32(_headers[0]);
        uint256 _difficulty = bytesToUint256(_headers[7]);
        bytes32 _receiptRoot = bytesToBytes32(_headers[5]);
        _init(
            _leastDifficulty,
            _totalDifficulty,
            _confirmedThreshold,
            _hash,
            _height,
            _parentHash,
            _difficulty,
            _receiptRoot
        );
    }

    // todo public -> internal
    function _init(
        uint256 _leastDifficulty,
        uint256 _totalDifficulty,
        uint256 _confirmedThreshold,
        bytes32 _hash,
        uint256 _height,
        bytes32 _parentHash,
        uint256 _difficulty,
        bytes32 _receiptRoot
    ) public {
        leastDifficulty = _leastDifficulty;
        confirmedThreshold = _confirmedThreshold;
        latest = ethHeader({
            height: _height,
            headerHash: _hash,
            parentHash: _parentHash,
            totalDifficulty: _totalDifficulty + _difficulty,
            receiptRoot: _receiptRoot
        });
        history[latest.height] = latest;
        maxDifficulty = latest.totalDifficulty;
    }

    function submitHeader(bytes32 _hash, bytes[] memory _headers) public {
        verifyHeader(_hash, _headers);
        uint256 _height = bytesToUint256(_headers[8]);
        bytes32 _parentHash = bytesToBytes32(_headers[0]);
        uint256 _difficulty = bytesToUint256(_headers[7]);
        bytes32 _receiptRoot = bytesToBytes32(_headers[5]);
        _submitHeader(_hash, _height, _parentHash, _difficulty, _receiptRoot);
    }

    // todo public -> internal
    function _submitHeader(
        bytes32 _hash,
        uint256 _height,
        bytes32 _parentHash,
        uint256 _difficulty,
        bytes32 _receiptRoot
    ) public {
        require(_difficulty > leastDifficulty, "least difficulty check");
        require(_height > latest.height, "height require");

        int256 found = findHeader(_height, _hash);
        require(found == 0, "duplicated header");

        found = findHeader(_height - 1, _parentHash);
        require(found > 0, "parent header not found");

        uint256 _totalDifficulty = 0;
        if (found == 1) {
            _totalDifficulty = latest.totalDifficulty + _difficulty;
        } else if (found == 2) {
            _totalDifficulty =
                unconfirmed[_height - 1][_parentHash].totalDifficulty +
                _difficulty;
        }
        require(_totalDifficulty > 0, "total diffculty");

        // update to unconfirmed
        tmp = ethHeader({
            height: _height,
            headerHash: _hash,
            parentHash: _parentHash,
            totalDifficulty: _totalDifficulty,
            receiptRoot: _receiptRoot
        });
        unconfirmed[_height][_hash] = tmp;

        // check difficulty consensus
        if (_totalDifficulty <= maxDifficulty) {
            return;
        }
        maxDifficulty = _totalDifficulty;

        // check confirmed threshold
        uint256 currentHeight = latest.height;
        if (_height - currentHeight < confirmedThreshold) {
            return;
        }

        // find next latest header
        uint256 latestHeight;
        bytes32 latestHash;
        (latestHeight, latestHash) = findNextLatestHeader(
            currentHeight,
            _height,
            _hash,
            _parentHash
        );
        require(latestHeight > 0, "find next latest block fail");

        updateLatestBlock(latestHeight, latestHash);
    }

    function updateLatestBlock(uint256 latestHeight, bytes32 latestHash)
        internal
    {
        latest = unconfirmed[latestHeight][latestHash];
        history[latestHeight] = latest;
    }

    // 0: not found
    // 1: in history
    // 2: in unconfirmed
    function findHeader(uint256 height, bytes32 hash)
        public
        view
        returns (int256)
    {
        uint256 latestHeight = latest.height;
        if (height <= latestHeight) {
            if (history[height].headerHash == hash) {
                return 1;
            } else {
                return 0;
            }
        }
        ethHeader storage header = unconfirmed[height][hash];
        if (header.height == 0) {
            return 0;
        }
        return 2;
    }

    function findNextLatestHeader(
        uint256 currentHeight,
        uint256 trustHeight,
        bytes32 trustHash,
        bytes32 trustParentHash
    ) internal view returns (uint256, bytes32) {
        for (;;) {
            uint256 height = trustHeight - 1;
            if (height == currentHeight) {
                return (trustHeight, trustHash);
            } else if (height < currentHeight) {
                return (0, trustHash);
            }
            ethHeader storage trust = unconfirmed[height][trustParentHash];

            if (trust.height == 0) {
                return (0, trustHash);
            }
            trustHeight = trust.height;
            trustHash = trust.headerHash;
            trustParentHash = trust.parentHash;
        }
    }

    function verifyHeader(bytes32 _hash, bytes[] memory _headers)
        internal
        pure
    {
        bytes32 _headerHash = keccak256(RLP.encodeList(_headers));
        require(_headerHash == _hash, "hash verified");
    }

    // function bytesToUint256(bytes memory _bytes)
    //     internal
    //     pure
    //     returns (uint256 value)
    // {
    //     assembly {
    //         value := mload(add(_bytes, 0x20))
    //     }
    // }
    function bytesToUint256(bytes memory bs) internal pure returns (uint256) {
        uint256 len = bs.length;
        uint256 result;
        assembly {
            result := mload(add(bs, 0x20))

            // shfit to the correct location if neccesary
            if lt(len, 32) {
                result := div(result, exp(256, sub(32, len)))
            }
        }
        return result;
    }

    // function bytesToUint256(bytes memory b) public returns (uint256){
    //     uint256 number;
    //     for(uint i=0;i<b.length;i++){
    //         number = number + uint(b[i])*(2**(8*(b.length-(i+1))));
    //     }
    //     return number;
    // }

    function bytesToBytes32(bytes memory _bytes)
        internal
        pure
        returns (bytes32 value)
    {
        if (_bytes.length == 0) {
            return 0x0;
        }

        assembly {
            value := mload(add(_bytes, 32))
        }
    }
}