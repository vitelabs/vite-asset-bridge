pragma solidity ^0.6.3;
pragma experimental ABIEncoderV2; // todo delete

import "./rlp.sol";

contract TestRLP {

    function test(bytes memory rlpParentNodes) public pure returns (bytes memory) {
        RLP.RLPItem memory item = RLP.toRLPItem(rlpParentNodes);
        RLP.RLPItem[] memory parentNodes = RLP.toList(item);

        bytes memory currentNode;
        RLP.RLPItem[] memory currentNodeList;
        currentNode = RLP.toBytes(parentNodes[2]);
        currentNodeList = RLP.toList(RLP.toRLPItem(currentNode));
        // _nibblesToTraverse(RLP.toBytes(currentNodeList[0]));
    }

    function _nibblesToTraverse(bytes memory encodedPartialPath, bytes memory path, uint pathPtr) private pure returns (uint) {
        uint len;
        // encodedPartialPath has elements that are each two hex characters (1 byte), but partialPath
        // and slicedPath have elements that are each one hex character (1 nibble)
        bytes memory partialPath = _getNibbleArray2(encodedPartialPath);
        bytes memory slicedPath = new bytes(partialPath.length);

        // pathPtr counts nibbles in path
        // partialPath.length is a number of nibbles
        for(uint i=pathPtr; i<pathPtr+partialPath.length; i++) {
            byte pathNibble = path[i];
            slicedPath[i-pathPtr] = pathNibble;
        }

        
        require(keccak256(partialPath) == keccak256(slicedPath), "--------");
        if(keccak256(partialPath) == keccak256(slicedPath)) {
            len = partialPath.length;
        } else {
            len = 0;
        }
        return len;
    }

    // bytes b must be hp encoded
    function _getNibbleArray(bytes memory b) private pure returns (bytes memory) {
        bytes memory nibbles;

        if(b.length>0) {
            nibbles = new bytes(b.length*2);
            for(uint i=0; i<nibbles.length; i++) {
                nibbles[i] = _getNthNibbleOfBytes(i,b);
            }
        }
        return nibbles;
    }

    // bytes b must be hp encoded
    function _getNibbleArray2(bytes memory b) private pure returns (bytes memory) {
        bytes memory nibbles;
        if(b.length>0) {
            uint8 offset;
            uint8 hpNibble = uint8(_getNthNibbleOfBytes(0,b));
            if(hpNibble == 1 || hpNibble == 3) {
                nibbles = new bytes(b.length*2-1);
                byte oddNibble = _getNthNibbleOfBytes(1,b);
                nibbles[0] = oddNibble;
                offset = 1;
            } else {
                nibbles = new bytes(b.length*2-2);
                offset = 0;
            }

            for(uint i=offset; i<nibbles.length; i++) {
                nibbles[i] = _getNthNibbleOfBytes(i-offset+2,b);
            }
        }
        return nibbles;
    }

    function _getNthNibbleOfBytes(uint n, bytes memory str) private pure returns (byte) {
        return byte(n%2==0 ? uint8(str[n/2])/0x10 : uint8(str[n/2])%0x10);
    }
}