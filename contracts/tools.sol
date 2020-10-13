pragma solidity ^0.6.3;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/cryptography/MerkleProof.sol";

contract Tools {
    function verify(bytes32 root, bytes32 leaf, bytes32[] memory proof) public pure returns (bool) {
        return MerkleProof.verify(proof, root, leaf);
    }

    function recover(bytes32 hash, bytes memory signature) public pure returns (address) {
        return ECDSA.recover(hash, signature);
    }
}
