pragma solidity ^0.6.3;
pragma experimental ABIEncoderV2;


contract EthBridgeV2 {
    // the latest confirmed header
    ethHeader public latest;
    // all confirmed header, and these can be used as proof
    mapping(uint256 => ethHeader) public history;

    // all pending headers, and headers with height less than the latest height will be deleted
    mapping(uint256 => mapping(bytes32 => ethHeader)) public unconfirmed;
    mapping(uint256 => bytes32[]) public unconfirmedIdx;

    // any header less than this difficulty will not be submitted successfully
    uint256 public maxDifficulty;

    // confirmed num
    uint256 public confirmedThreshold;

    struct ethHeader {
        uint256 height;
        bytes32 headerHash;
        bytes32 parentHash;
        uint256 totalDifficulty;
        bytes32 receiptRoot;
        uint256 difficulty;
        bytes32 unclesHash;
        uint256 timestamp;
    }

    constructor() public {}

    // todo  init -> constructor
    function init(
        uint256 _totalDifficulty,
        uint256 _confirmedThreshold,
        bytes32 _hash,
        bytes memory _headersRaw
    ) public {
        verifyHeaderHash(_hash, _headersRaw);

        RLPItem[] memory _headers = rlpToList(toRLPItem(_headersRaw));

        uint256 _height = rlpToUint(_headers[8]);
        bytes32 _parentHash = rlpToBytes32(_headers[0]);
        uint256 _difficulty = rlpToUint(_headers[7]);
        bytes32 _receiptRoot = rlpToBytes32(_headers[5]);
        ethHeader memory tmp = ethHeader({
            height: _height,
            headerHash: _hash,
            parentHash: _parentHash,
            totalDifficulty: 0,
            receiptRoot: _receiptRoot,
            difficulty: rlpToUint(_headers[7]),
            unclesHash: rlpToBytes32(_headers[1]),
            timestamp: rlpToUint(_headers[11])
        });

        _init(
            _totalDifficulty,
            _confirmedThreshold,
            _hash,
            tmp
        );
    }

    // todo public -> internal
    function _init(
        uint256 _totalDifficulty,
        uint256 _confirmedThreshold,
        bytes32 _hash,
        ethHeader memory tmp
    ) public {
        confirmedThreshold = _confirmedThreshold;
        latest = ethHeader({
            height: tmp.height,
            headerHash: tmp.headerHash,
            parentHash: tmp.parentHash,
            totalDifficulty: _totalDifficulty + tmp.difficulty,
            receiptRoot: tmp.receiptRoot,
            difficulty: tmp.difficulty,
            unclesHash: tmp.unclesHash,
            timestamp: tmp.timestamp
        });
        history[latest.height] = latest;
        maxDifficulty = latest.totalDifficulty;
    }

    function submitHeader(bytes32 _hash, bytes memory _headersRaw) public {
        verifyHeaderHash(_hash, _headersRaw);

        RLPItem[] memory _headers = rlpToList(toRLPItem(_headersRaw));

        ethHeader memory tmp = ethHeader({
            height:rlpToUint(_headers[8]),
            headerHash: _hash,
            parentHash: rlpToBytes32(_headers[0]),
            totalDifficulty: 0,
            receiptRoot: rlpToBytes32(_headers[5]),
            difficulty: rlpToUint(_headers[7]),
            unclesHash: rlpToBytes32(_headers[1]),
            timestamp: rlpToUint(_headers[11])
        });
        

        _submitHeader(tmp);
    }

    // todo public -> internal
    function _submitHeader(
        ethHeader memory tmp 
    ) public {
        require(tmp.height > latest.height, "height require");

        int256 found = findHeader(tmp.height, tmp.headerHash);
        require(found == 0, "duplicated header");

        found = findHeader(tmp.height - 1, tmp.parentHash);
        require(found > 0, "parent header not found");

        uint256 _totalDifficulty = 0;
        if (found == 1) {
            _totalDifficulty = latest.totalDifficulty + tmp.difficulty;
        } else if (found == 2) {
            _totalDifficulty =
                unconfirmed[tmp.height- 1][tmp.parentHash].totalDifficulty +
                tmp.difficulty;
        }
        require(_totalDifficulty > 0, "total diffculty");
        verifyHeader(tmp, getHeader(tmp.height-1, tmp.parentHash, found));
        // update to unconfirmed
        // tmp = ethHeader({
        //     height: _height,
        //     headerHash: _hash,
        //     parentHash: _parentHash,
        //     totalDifficulty: _totalDifficulty,
        //     receiptRoot: _receiptRoot
        // });
        unconfirmed[tmp.height][tmp.headerHash] = ethHeader({
            height: tmp.height,
            headerHash: tmp.headerHash,
            parentHash: tmp.parentHash,
            totalDifficulty: _totalDifficulty,
            receiptRoot: tmp.receiptRoot,
            difficulty: tmp.difficulty,
            unclesHash: tmp.unclesHash,
            timestamp: tmp.timestamp
        });
        unconfirmedIdx[tmp.height].push(tmp.headerHash);

        // check difficulty consensus
        if (_totalDifficulty <= maxDifficulty) {
            return;
        }
        maxDifficulty = _totalDifficulty;

        // check confirmed threshold
        uint256 currentHeight = latest.height;
        if (tmp.height - currentHeight < confirmedThreshold) {
            return;
        }

        // find next latest header
        uint256 latestHeight;
        bytes32 latestHash;
        (latestHeight, latestHash) = findNextLatestHeader(
            currentHeight,
            tmp.height,
            tmp.headerHash,
            tmp.parentHash
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
    function findHeader(uint256 _height, bytes32 _hash)
        public
        view
        returns (int256)
    {
        uint256 latestHeight = latest.height;
        if (_height <= latestHeight) {
            if (history[_height].headerHash == _hash) {
                return 1;
            } else {
                return 0;
            }
        }
        ethHeader storage header = unconfirmed[_height][_hash];
        if (header.height == 0) {
            return 0;
        }
        return 2;
    }

    function getHeader(uint _height, bytes32 _hash, int256 found) public view returns(ethHeader memory){                        
        if(found==1){
            return latest;
        }else if (found ==2){
            return unconfirmed[_height][_hash];
        }
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

    function verifyHeaderHash(bytes32 _hash, bytes memory _headers) internal pure {
        bytes32 _headerHash = keccak256(_headers);
        require(_headerHash == _hash, "hash verified");
    }

    // see YP section 4.3.4 "Block Header Validity"
    function verifyHeader(ethHeader memory _header, ethHeader memory _parent) internal view{
        // require(_header.extra.length<32, "extra-data too long");
        require(_header.timestamp>=_parent.timestamp, "timestamp older than parent");
        // todo
        // require(_header.GasUsed <= _header.GasLimit, "invalid gasUsed && gasLimit");
        // require(mul(absSub(_header.GasLimit, _parent.GasLimit), 1024) < _parent.GasLimit, "invalid gas limit 1");
        // require(header.GasLimit>=500, "invalid gas limit 2");
        require(_header.difficulty == calDifficulty(_header.timestamp, _parent), "invalid difficulty");
    }
    // see https://github.com/ethereum/EIPs/issues/100, https://eips.ethereum.org/EIPS/eip-1234, https://eips.ethereum.org/EIPS/eip-2384
    function calDifficulty(uint timestamp, ethHeader memory _parent) internal view returns(uint){
        // todo
        uint diff = _parent.difficulty;
        uint unclesNum = 1;
        if(_parent.unclesHash != hex"1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347"){
            unclesNum = 2;
        }
        uint x1 = div(timestamp - _parent.timestamp, 9);
        uint x2 = 0;
        if(unclesNum>=x1) {
            x2 = add(diff, mul(div(diff, 2048), unclesNum - x1));
        }else if(x1-unclesNum<99){
            x2 = sub(diff, mul(div(diff, 2048), x1 - unclesNum));
        }else{
            x2 = sub(diff, mul(div(diff, 2048), 99));
        }
        uint fakeBlockNumber = 0;
        uint bombDelayFromParent = 8999999;
        if (_parent.height>=bombDelayFromParent) {
            fakeBlockNumber = _parent.height - bombDelayFromParent;
        }
        uint expDiffPeriod = 100000;
        uint periodCount = div(fakeBlockNumber, expDiffPeriod);

        uint x3 = x2;
        if(periodCount>=2){                
            x3 = x3 + 2**(periodCount-2);
        }
        return x3;
    }


    function _headerParentHash(RLPItem[] memory _header) internal pure returns(bytes32){

    }


    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        uint256 c = a - b;

        return c;
    }
    function absSub(uint256 a, uint256 b) internal pure returns (uint256) {
        if(a>=b){
            return a-b;
        }else{
            return b-a;
        }
    }
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "SafeMath: division by zero");
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
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
        RLPItem[] memory args = rlpToList(toRLPItem(argsRaw));

        deposit(
            rlpToUint(args[0]),
            rlpToBytes32(args[1]),
            rlpToBytes(args[2]),
            rlpToBytes(args[3]),
            rlpToBytes(args[4]),
            rlpToBytes(args[5]),
            rlpToBytes(args[6]),
            rlpToBytes(args[7]),
            rlpToUint(args[8])
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
            merkleVerify(
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

        return encodeListBloom(receipt, receiptFlags);
    }

    event Deposit(uint256, uint256, uint256, uint256);

    function processLog(bytes memory logsRaw, uint256 logIdx) public {
        RLPItem[] memory logs = rlpToList(toRLPItem(logsRaw));

        RLPItem memory log = logs[logIdx];
        uint256 token;
        uint256 from;
        uint256 to;
        uint256 amount;
        (token, from, to, amount) = parseLog(log);
        emit Deposit(token, from, to, amount);
    }

    // Token,From,To,Amount
    function parseLog(RLPItem memory log)
        public
        pure
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        RLPItem[] memory args = rlpToList(log);

        require(args.length == 3, "log args length");
        require(
            bytesEquals(
                rlpToBytes(args[0]),
                bytes(hex"021576770cb3729716ccfb687afdb4c6bf720cb6")
            ),
            "log address required"
        );
        RLPItem[] memory topics = rlpToList(args[1]);
        require(topics.length == 3, "log topics length");
        require(
            bytesEquals(
                rlpToBytes(topics[0]),
                bytes(
                    hex"ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
                )
            ),
            "log name required"
        );
        return (
            0,
            rlpToUint(topics[1]),
            rlpToUint(topics[2]),
            rlpToUint(args[2])
        );
    }

    

    function encodeListBloom(bytes[] memory arr, bool[] memory flags)
        internal
        pure
        returns (bytes memory)
    {
        require(arr.length == flags.length, "encode list length required");
        uint256 len = arr.length;
        bytes memory raw;
        for (uint256 i = 0; i < len; i++) {
            if (flags[i]) {
                raw = abi.encodePacked(raw, encodeBytes(arr[i]));
            } else {
                raw = abi.encodePacked(raw, arr[i]);
            }
        }
        return abi.encodePacked(encodeLength(raw.length, 192), raw);
    }

    function encodeBytes(bytes memory self)
        internal
        pure
        returns (bytes memory)
    {
        bytes memory encoded;
        if (self.length == 1 && uint8(self[0]) <= 128) {
            encoded = self;
        } else {
            encoded = abi.encodePacked(encodeLength(self.length, 128), self);
        }
        return encoded;
    }

    function encodeLength(uint256 len, uint256 offset)
        public
        pure
        returns (bytes memory)
    {
        bytes memory encoded;
        if (len < 56) {
            encoded = new bytes(1);
            encoded[0] = bytes32(len + offset)[31];
        } else {
            uint256 lenLen;
            uint256 i = 1;
            while (len / i != 0) {
                lenLen++;
                i *= 256;
            }

            encoded = new bytes(lenLen + 1);
            encoded[0] = bytes32(lenLen + offset + 55)[31];
            for (i = 1; i <= lenLen; i++) {
                encoded[i] = bytes32((len / (256**(lenLen - i))) % 256)[31];
            }
        }
        return encoded;
    }

    uint8 constant STRING_SHORT_START = 0x80;
    uint8 constant STRING_LONG_START = 0xb8;
    uint8 constant LIST_SHORT_START = 0xc0;
    uint8 constant LIST_LONG_START = 0xf8;
    uint8 constant WORD_SIZE = 32;

    struct RLPItem {
        uint256 len;
        uint256 memPtr;
    }

    /*
     * @param item RLP encoded bytes
     */
    function toRLPItem(bytes memory item)
        internal
        pure
        returns (RLPItem memory)
    {
        uint256 memPtr;
        assembly {
            memPtr := add(item, 0x20)
        }

        return RLPItem(item.length, memPtr);
    }

    /*
     * @param item RLP encoded bytes
     */
    function rlpLen(RLPItem memory item) internal pure returns (uint256) {
        return item.len;
    }

    /*
     * @param item RLP encoded bytes
     */
    function payloadLen(RLPItem memory item) internal pure returns (uint256) {
        return item.len - _payloadOffset(item.memPtr);
    }

    /*
     * @param item RLP encoded list in bytes
     */
    function rlpToList(RLPItem memory item)
        internal
        pure
        returns (RLPItem[] memory)
    {
        require(rlpIsList(item), "list require");

        uint256 items = numItems(item);
        RLPItem[] memory result = new RLPItem[](items);

        uint256 memPtr = item.memPtr + _payloadOffset(item.memPtr);
        uint256 dataLen;
        for (uint256 i = 0; i < items; i++) {
            dataLen = _itemLength(memPtr);
            result[i] = RLPItem(dataLen, memPtr);
            memPtr = memPtr + dataLen;
        }

        return result;
    }

    // @return indicator whether encoded payload is a list. negate this function call for isData.
    function rlpIsList(RLPItem memory item) internal pure returns (bool) {
        if (item.len == 0) return false;

        uint8 byte0;
        uint256 memPtr = item.memPtr;
        assembly {
            byte0 := byte(0, mload(memPtr))
        }

        if (byte0 < LIST_SHORT_START) return false;
        return true;
    }

    /** RLPItem conversions into data types **/

    function rlpToBytes32(RLPItem memory self)
        internal
        pure
        returns (bytes32 data)
    {
        return bytes32(rlpToUint(self));
    }


    function rlpToUint(RLPItem memory item) internal pure returns (uint256) {
        require(item.len > 0 && item.len <= 33);

        uint256 offset = _payloadOffset(item.memPtr);
        uint256 len = item.len - offset;

        uint256 result;
        uint256 memPtr = item.memPtr + offset;
        assembly {
            result := mload(memPtr)

            // shfit to the correct location if neccesary
            if lt(len, 32) {
                result := div(result, exp(256, sub(32, len)))
            }
        }

        return result;
    }


    function rlpToBytes(RLPItem memory item) internal pure returns (bytes memory) {
        require(item.len > 0);

        uint256 offset = _payloadOffset(item.memPtr);
        uint256 len = item.len - offset; // data length
        bytes memory result = new bytes(len);

        uint256 destPtr;
        assembly {
            destPtr := add(0x20, result)
        }

        copy(item.memPtr + offset, destPtr, len);
        return result;
    }

    // @returns raw rlp encoding in bytes
    function toRlpBytes(RLPItem memory item)
        internal
        pure
        returns (bytes memory)
    {
        bytes memory result = new bytes(item.len);
        if (result.length == 0) return result;

        uint256 ptr;
        assembly {
            ptr := add(0x20, result)
        }

        copy(item.memPtr, ptr, item.len);
        return result;
    }

    /*
     * Private Helpers
     */

    // @return number of payload items inside an encoded list.
    function numItems(RLPItem memory item) private pure returns (uint256) {
        if (item.len == 0) return 0;

        uint256 count = 0;
        uint256 currPtr = item.memPtr + _payloadOffset(item.memPtr);
        uint256 endPtr = item.memPtr + item.len;
        while (currPtr < endPtr) {
            currPtr = currPtr + _itemLength(currPtr); // skip over an item
            count++;
        }

        return count;
    }

    // @return entire rlp item byte length
    function _itemLength(uint256 memPtr) private pure returns (uint256) {
        uint256 itemLen;
        uint256 byte0;
        assembly {
            byte0 := byte(0, mload(memPtr))
        }

        if (byte0 < STRING_SHORT_START) itemLen = 1;
        else if (byte0 < STRING_LONG_START)
            itemLen = byte0 - STRING_SHORT_START + 1;
        else if (byte0 < LIST_SHORT_START) {
            assembly {
                let byteLen := sub(byte0, 0xb7) // # of bytes the actual length is
                memPtr := add(memPtr, 1) // skip over the first byte

                /* 32 byte word size */
                let dataLen := div(mload(memPtr), exp(256, sub(32, byteLen))) // right shifting to get the len
                itemLen := add(dataLen, add(byteLen, 1))
            }
        } else if (byte0 < LIST_LONG_START) {
            itemLen = byte0 - LIST_SHORT_START + 1;
        } else {
            assembly {
                let byteLen := sub(byte0, 0xf7)
                memPtr := add(memPtr, 1)

                let dataLen := div(mload(memPtr), exp(256, sub(32, byteLen))) // right shifting to the correct length
                itemLen := add(dataLen, add(byteLen, 1))
            }
        }

        return itemLen;
    }

    // @return number of bytes until the data
    function _payloadOffset(uint256 memPtr) private pure returns (uint256) {
        uint256 byte0;
        assembly {
            byte0 := byte(0, mload(memPtr))
        }

        if (byte0 < STRING_SHORT_START) return 0;
        else if (
            byte0 < STRING_LONG_START ||
            (byte0 >= LIST_SHORT_START && byte0 < LIST_LONG_START)
        ) return 1;
        else if (byte0 < LIST_SHORT_START)
            // being explicit
            return byte0 - (STRING_LONG_START - 1) + 1;
        else return byte0 - (LIST_LONG_START - 1) + 1;
    }

    /*
     * @param src Pointer to source
     * @param dest Pointer to destination
     * @param len Amount of memory to copy from the source
     */
    function copy(
        uint256 src,
        uint256 dest,
        uint256 len
    ) private pure {
        if (len == 0) return;

        // copy as many word sizes as possible
        for (; len >= WORD_SIZE; len -= WORD_SIZE) {
            assembly {
                mstore(dest, mload(src))
            }

            src += WORD_SIZE;
            dest += WORD_SIZE;
        }

        // left over bytes. Mask is used to remove unwanted bytes from the word
        uint256 mask = 256**(WORD_SIZE - len) - 1;
        assembly {
            let srcpart := and(mload(src), not(mask)) // zero out src
            let destpart := and(mload(dest), mask) // retrieve the bytes
            mstore(dest, or(destpart, srcpart))
        }
    }

    function bytesEquals(bytes memory b1, bytes memory b2)
        public
        pure
        returns (bool)
    {
        if (b1.length != b2.length) {
            return false;
        }
        for (uint256 i = 0; i < b1.length; i++) {
            if (b1[i] != b2[i]) {
                return false;
            }
        }
        return true;
    }
    /*
     * @dev Verifies a merkle patricia proof.
     * @param value The terminating value in the trie.
     * @param encodedPath The path in the trie leading to value.
     * @param rlpParentNodes The rlp encoded stack of nodes.
     * @param root The root hash of the trie.
     * @return The boolean validity of the proof.
     */
    function merkleVerify(
        bytes memory value,
        bytes memory encodedPath,
        bytes memory rlpParentNodes,
        bytes32 root
    ) internal pure returns (bool) {
        RLPItem memory item = toRLPItem(rlpParentNodes);
        RLPItem[] memory parentNodes = rlpToList(item);

        bytes memory currentNode;
        RLPItem[] memory currentNodeList;

        bytes32 nodeKey = root;
        uint256 pathPtr = 0;

        bytes memory path = _getNibbleArray(encodedPath);
        if (path.length == 0) {
            return false;
        }

        for (uint256 i = 0; i < parentNodes.length; i++) {
            if (pathPtr > path.length) {
                return false;
            }

            currentNode = rlpToBytes(parentNodes[i]);
            if (nodeKey != keccak256(currentNode)) {
                return false;
            }
            currentNodeList = rlpToList(toRLPItem(currentNode));

            if (currentNodeList.length == 17) {
                require(uint8(path[0]) == 8, "path[0] ==8");
                if (pathPtr == path.length) {
                    if (
                        keccak256(rlpToBytes(currentNodeList[16])) ==
                        keccak256(value)
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                }

                uint8 nextPathNibble = uint8(path[pathPtr]);

                if (nextPathNibble > 16) {
                    return false;
                }
                nodeKey = rlpToBytes32(currentNodeList[nextPathNibble]);
                pathPtr += 1;
            } else if (currentNodeList.length == 2) {
                pathPtr += _nibblesToTraverse(
                    rlpToBytes(currentNodeList[0]),
                    path,
                    pathPtr
                );

                if (pathPtr == path.length) {
                    //leaf node
                    if (
                        keccak256(rlpToBytes(currentNodeList[1])) ==
                        keccak256(value)
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                }
                //extension node
                if (
                    _nibblesToTraverse(
                        rlpToBytes(currentNodeList[0]),
                        path,
                        pathPtr
                    ) == 0
                ) {
                    return false;
                }

                nodeKey = rlpToBytes32(currentNodeList[1]);
            } else {
                return false;
            }
        }
    }

    function _nibblesToTraverse(
        bytes memory encodedPartialPath,
        bytes memory path,
        uint256 pathPtr
    ) private pure returns (uint256) {
        uint256 len;
        // encodedPartialPath has elements that are each two hex characters (1 byte), but partialPath
        // and slicedPath have elements that are each one hex character (1 nibble)
        bytes memory partialPath = _getNibbleArray2(encodedPartialPath);
        bytes memory slicedPath = new bytes(partialPath.length);

        // pathPtr counts nibbles in path
        // partialPath.length is a number of nibbles
        for (uint256 i = pathPtr; i < pathPtr + partialPath.length; i++) {
            bytes1 pathNibble = path[i];
            slicedPath[i - pathPtr] = pathNibble;
        }

        if (keccak256(partialPath) == keccak256(slicedPath)) {
            len = partialPath.length;
        } else {
            len = 0;
        }
        return len;
    }

    // bytes b must be hp encoded
    function _getNibbleArray(bytes memory b)
        private
        pure
        returns (bytes memory)
    {
        bytes memory nibbles;

        if (b.length > 0) {
            nibbles = new bytes(b.length * 2);
            for (uint256 i = 0; i < nibbles.length; i++) {
                nibbles[i] = _getNthNibbleOfBytes(i, b);
            }
        }
        return nibbles;
    }

    function _getNthNibbleOfBytes(uint256 n, bytes memory str)
        private
        pure
        returns (bytes1)
    {
        return
            bytes1(
                n % 2 == 0 ? uint8(str[n / 2]) / 0x10 : uint8(str[n / 2]) % 0x10
            );
    }

    // bytes b must be hp encoded
    function _getNibbleArray2(bytes memory b)
        private
        pure
        returns (bytes memory)
    {
        bytes memory nibbles;
        if (b.length > 0) {
            uint8 offset;
            uint8 hpNibble = uint8(_getNthNibbleOfBytes(0, b));
            if (hpNibble == 1 || hpNibble == 3) {
                nibbles = new bytes(b.length * 2 - 1);
                bytes1 oddNibble = _getNthNibbleOfBytes(1, b);
                nibbles[0] = oddNibble;
                offset = 1;
            } else {
                nibbles = new bytes(b.length * 2 - 2);
                offset = 0;
            }

            for (uint256 i = offset; i < nibbles.length; i++) {
                nibbles[i] = _getNthNibbleOfBytes(i - offset + 2, b);
            }
        }
        return nibbles;
    }
}