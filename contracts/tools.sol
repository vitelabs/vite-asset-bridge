pragma solidity ^0.6.3;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/cryptography/MerkleProof.sol";
import "./merkle_patricia_proof.sol";

contract Tools {
    function verify(
        bytes32 root,
        bytes32 leaf,
        bytes32[] memory proof
    ) public pure returns (bool) {
        return MerkleProof.verify(proof, root, leaf);
    }

    function recover(bytes32 hash, bytes memory signature)
        public
        pure
        returns (address)
    {
        return ECDSA.recover(hash, signature);
    }

    function verifyMerklePatriciaProof(
        bytes memory value,
        bytes memory encodedPath,
        bytes memory rlpParentNodes,
        bytes32 root
    ) public pure returns (bool) {
        return
            MerklePatriciaProof.verify(
                value,
                encodedPath,
                rlpParentNodes,
                root
            );
    }

    event Deposit(uint256 indexed from, uint256 indexed to, uint256 amount);

    function receiptBuild(
        bytes memory status,
        bytes memory cumulativeGas,
        bytes memory logsBloom,
        bytes[] memory logs,
        uint256 logIdx
    ) public returns (bytes32) {
        bool[] memory logsFlags = new bool[](logs.length);
        bytes memory rlpLogs = RLPEncoder.encodeListBloom(logs, logsFlags);
        bytes[] memory receipt = new bytes[](4);
        receipt[0] = status;
        receipt[1] = cumulativeGas;
        receipt[2] = logsBloom;
        receipt[3] = rlpLogs;

        bool[] memory receiptFlags = new bool[](4);
        receiptFlags[0] = true;
        receiptFlags[1] = true;
        receiptFlags[2] = true;

        log(logs[logIdx]);

        return keccak256(RLPEncoder.encodeListBloom(receipt, receiptFlags));
    }

    function log(bytes memory log) public {
        RLP.RLPItem memory item = RLP.toRLPItem(log);
        RLP.RLPItem[] memory args = RLP.toList(item);

        require(args.length == 3, "log args length");
        require(
            bytesEquals(
                RLP.toBytes(args[0]),
                bytes(hex"021576770cb3729716ccfb687afdb4c6bf720cb6")
            ),
            "log address required"
        );
        RLP.RLPItem[] memory topics = RLP.toList(args[1]);
        require(topics.length == 3, "log topics length");
        require(
            bytesEquals(
                RLP.toBytes(topics[0]),
                bytes(
                    hex"ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
                )
            ),
            "log name required"
        );
        emit Deposit(
            RLP.toUint(topics[1]),
            RLP.toUint(topics[2]),
            RLP.toUint(args[2])
        );
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
}

// contract MPT {
//     function validateMPTProof(
//         bytes32 rootHash,
//         bytes memory mptKey,
//         RLPReader.RLPItem[] memory stack,
//         bytes[] memory proofs
//     ) internal pure returns (bytes memory value) {
//         uint256 mptKeyOffset = 0;

//         bytes32 nodeHashHash;
//         bytes memory rlpNode;
//         bytes[] memory node = proofs;

//         RLPReader.RLPItem memory rlpValue;

//         if (stack.length == 0) {
//             // Root hash of empty Merkle-Patricia-Trie
//             require(
//                 rootHash ==
//                     0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421
//             );
//             return new bytes(0);
//         }

//         // Traverse stack of nodes starting at root.
//         uint256 i = 0;

//         // We use the fact that an rlp encoded list consists of some
//         // encoding of its length plus the concatenation of its
//         // *rlp-encoded* items.
//         rlpNode = stack[i].toRlpBytes();
//         // The root node is hashed with Keccak-256 ...
//         if (i == 0 && rootHash != keccak256(rlpNode)) {
//             revert();
//         }
//         // ... whereas all other nodes are hashed with the MPT
//         // hash function.
//         if (i != 0 && nodeHashHash != mptHashHash(rlpNode)) {
//             revert();
//         }

//         if (mptKeyOffset != mptKey.length) {
//             // we haven't consumed the entire path, so we need to look at a child
//             uint8 nibble = uint8(mptKey[mptKeyOffset]);
//             mptKeyOffset += 1;
//             if (nibble >= 16) {
//                 // each element of the path has to be a nibble
//                 revert();
//             }

//             if (isEmptyBytesequence(node[nibble])) {
//                 // Sanity
//                 if (i != stack.length - 1) {
//                     // leaf node should be at last level
//                     revert();
//                 }

//                 return new bytes(0);
//             } else if (!node[nibble].isList()) {
//                 nodeHashHash = keccak256(node[nibble].toBytes());
//             } else {
//                 nodeHashHash = keccak256(node[nibble].toRlpBytes());
//             }
//         } else {
//             // we have consumed the entire mptKey, so we need to look at what's contained in this node.

//             // Sanity
//             if (i != stack.length - 1) {
//                 // should be at last level
//                 revert();
//             }

//             return node[16].toBytes();
//         }
//     }
// }
