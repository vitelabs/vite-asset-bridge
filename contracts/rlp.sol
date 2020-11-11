pragma solidity ^0.6.0;

library RLP {
    function encodeList(bytes[] memory arr)
        internal
        pure
        returns (bytes memory)
    {
        uint256 len = arr.length;
        bytes memory raw;
        for (uint256 i = 0; i < len; i++) {
            raw = abi.encodePacked(raw, encodeBytes(arr[i]));
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
}
