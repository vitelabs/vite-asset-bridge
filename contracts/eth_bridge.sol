pragma solidity ^0.6.3;
pragma experimental ABIEncoderV2;

import "./rlp.sol";
import "./merkle_patricia_proof.sol";

contract EthBridge {
    // the latest confirmed header
    ethHeader public latest;
    // all confirmed header, and these can be used as proof
    mapping(uint256 => ethHeader) public history;

    // all pending headers, and headers with height less than the latest height will be deleted
    mapping(uint256 => mapping(bytes32 => ethHeader)) public unconfirmed;
    mapping(uint256 => bytes32[]) public unconfirmedIdx;

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
        bytes memory _headersRaw
    ) public {
        verifyHeader(_hash, _headersRaw);

        RLP.RLPItem[] memory _headers = RLP.toList(RLP.toRLPItem(_headersRaw));

        uint256 _height = RLP.toUint(_headers[8]);
        bytes32 _parentHash = RLP.toBytes32(_headers[0]);
        uint256 _difficulty = RLP.toUint(_headers[7]);
        bytes32 _receiptRoot = RLP.toBytes32(_headers[5]);
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

    function submitHeader(bytes32 _hash, bytes memory _headersRaw) public {
        verifyHeader(_hash, _headersRaw);

        RLP.RLPItem[] memory _headers = RLP.toList(RLP.toRLPItem(_headersRaw));

        uint256 _height = RLP.toUint(_headers[8]);
        bytes32 _parentHash = RLP.toBytes32(_headers[0]);
        uint256 _difficulty = RLP.toUint(_headers[7]);
        bytes32 _receiptRoot = RLP.toBytes32(_headers[5]);

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
        unconfirmedIdx[_height].push(_hash);

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

        uint256 len = unconfirmedIdx[latestHeight].length;
        for (uint256 i = 0; i < len; i++) {
            delete unconfirmed[latestHeight][unconfirmedIdx[latestHeight][i]];
        }
        delete unconfirmedIdx[latestHeight];
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

    function verifyHeader(bytes32 _hash, bytes memory _headers) internal pure {
        bytes32 _headerHash = keccak256(_headers);
        require(_headerHash == _hash, "hash verified");
    }

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

    // -----------------------------------------------------------
    // -----------------------------------------------------------
    // -----------------------------------------------------------
    // -----------------------------------------------------------
    // -----------------------------------------------------------
    // -----------------------------------------------------------
    // -----------------------------------------------------------
    // -----------------------------------------------------------

    mapping(bytes32 => mapping(bytes32 => bool)) deposited;

    function _deposit(bytes memory argsRaw) public {
        RLP.RLPItem[] memory args = RLP.toList(RLP.toRLPItem(argsRaw));

        deposit(
            RLP.toUint(args[0]),
            RLP.toBytes32(args[1]),
            RLP.toBytes(args[2]),
            RLP.toBytes(args[3]),
            RLP.toBytes(args[4]),
            RLP.toBytes(args[5]),
            RLP.toBytes(args[6]),
            RLP.toBytes(args[7]),
            RLP.toUint(args[8])
        );
    }

    function deposit(
        uint256 blockHeight,
        bytes32 root,
        bytes memory encodedPath,
        bytes memory rlpParentNodes,
        bytes memory status,
        bytes memory cumulativeGas,
        bytes memory logsBloom,
        bytes memory logsRaw,
        uint256 logIdx
    ) public {
        requireBasic(blockHeight, root, encodedPath);

        verifyReceipt(
            root,
            encodedPath,
            rlpParentNodes,
            status,
            cumulativeGas,
            logsBloom,
            logsRaw
        );

        processLog(logsRaw, logIdx);
    }

    function requireBasic(
        uint256 blockHeight,
        bytes32 root,
        bytes memory encodedPath
    ) internal {
        require(blockHeight <= latest.height, "block height required");
        require(
            history[blockHeight].receiptRoot == root,
            "block receipt root required"
        );

        bytes32 path = keccak256(encodedPath);
        require(!deposited[root][path], "duplicated deposit");
        deposited[root][path] = true;
    }

    function verifyReceipt(
        bytes32 root,
        bytes memory encodedPath,
        bytes memory rlpParentNodes,
        bytes memory status,
        bytes memory cumulativeGas,
        bytes memory logsBloom,
        bytes memory logsRaw
    ) public pure {
        bytes memory value = buildReceipt(
            status,
            cumulativeGas,
            logsBloom,
            logsRaw
        );

        require(
            MerklePatriciaProof.verify(
                value,
                encodedPath,
                rlpParentNodes,
                root
            ),
            "receipt proof"
        );
    }

    function buildReceipt(
        bytes memory status,
        bytes memory cumulativeGas,
        bytes memory logsBloom,
        bytes memory logsRaw
    ) public pure returns (bytes memory) {
        bytes[] memory receipt = new bytes[](4);
        receipt[0] = status;
        receipt[1] = cumulativeGas;
        receipt[2] = logsBloom;
        receipt[3] = logsRaw;

        bool[] memory receiptFlags = new bool[](4);
        receiptFlags[0] = true;
        receiptFlags[1] = true;
        receiptFlags[2] = true;

        return RLPEncoder.encodeListBloom(receipt, receiptFlags);
    }

    event Deposit(uint256, uint256, uint256, uint256);

    function processLog(bytes memory logsRaw, uint256 logIdx) public {
        RLP.RLPItem[] memory logs = RLP.toList(RLP.toRLPItem(logsRaw));

        RLP.RLPItem memory log = logs[logIdx];
        uint256 token;
        uint256 from;
        uint256 to;
        uint256 amount;
        (token, from, to, amount) = parseLog(log);
        emit Deposit(token, from, to, amount);
    }

    // Token,From,To,Amount
    function parseLog(RLP.RLPItem memory log)
        public
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        RLP.RLPItem[] memory args = RLP.toList(log);

        require(args.length == 3, "log args length");
        require(
            BytesLib.bytesEquals(
                RLP.toBytes(args[0]),
                bytes(hex"021576770cb3729716ccfb687afdb4c6bf720cb6")
            ),
            "log address required"
        );
        RLP.RLPItem[] memory topics = RLP.toList(args[1]);
        require(topics.length == 3, "log topics length");
        require(
            BytesLib.bytesEquals(
                RLP.toBytes(topics[0]),
                bytes(
                    hex"ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
                )
            ),
            "log name required"
        );
        return (
            0,
            RLP.toUint(topics[1]),
            RLP.toUint(topics[2]),
            RLP.toUint(args[2])
        );
    }
}
