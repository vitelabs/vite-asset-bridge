pragma solidity ^0.6.3;
pragma experimental ABIEncoderV2; // todo delete

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/cryptography/MerkleProof.sol";
import "./interfaces.sol";


contract ViteProxyV02 is Vite {
    mapping(bytes32 => bool) public rootMap;

    address[] public signerArr;
    mapping(address => bool) public signerMap;
    uint64 public viteNonce;

    constructor(address[] memory _signers, uint64 _nonce) public {
        require(verifyDuplication(_signers), "signer duplicated");

        // We know the length of the array
        uint len = _signers.length;
        for (uint i = 0; i < len; i++) {
            signerArr.push(_signers[i]);
            signerMap[_signers[i]] = true;
        }
        viteNonce = _nonce;
    }

    function txApproved(
        bytes32 _root,
        TxMerkleProof memory _txProof
    ) public view returns (bool) {
        require(rootMap[_root], "error viteNonce");
        return MerkleProof.verify(_txProof.proof, _root, _txProof.txHash);
    }

    // every four hours
    function submitSigners(
        SigProof memory _sigProof,
        SignersMerkleProof memory _signersProof
    ) public override {
        require(verifyDuplication(_sigProof.signers), "signer duplicated");
        require(verifyDuplication(_signersProof.signers), "updated signer duplicated");
        require(verifyMajorSigners(_sigProof.signers), "major signer failed");
        require(_signersProof.signers.length == signerArr.length, "update signers length check");
        require(verifySign(_sigProof), "sign failed");
        require(verifySignersMerkle(_sigProof.root, _signersProof), "signers merkle verify");
        require(_sigProof.rootNonce == viteNonce + 1, "nonce check");

        _updateSigners(_signersProof.signers);
        _updateNonceRoot(_sigProof.rootNonce, _sigProof.root);
    }

    function submitProof(
        SigProof memory _sigProof
    ) public override {
        require(verifyDuplication(_sigProof.signers), "signer duplicated");
        require(verifyMajorSigners(_sigProof.signers), "major signer");
        require(verifySign(_sigProof), "sign failed");
        // todo
        require(_sigProof.rootNonce == viteNonce, "nonce not equals");

        // update merkle root info
        _updateRoot(_sigProof.root);
    }


    function _updateSigners(address[] memory _signers) internal {
        for (uint i = 0; i < signerArr.length; i++) {
            delete signerMap[signerArr[i]];
        }
        delete signerArr;

        uint len = _signers.length;
        for (uint i = 0; i < len; i++) {
            signerArr.push(_signers[i]);
            signerMap[_signers[i]] = true;
        }
    }

    function _updateRoot(bytes32 _root) internal {
        rootMap[_root] = true;
    }

    function _updateNonceRoot(uint64 _nonce, bytes32 _root) internal {
        rootMap[_root] = true;
        viteNonce = _nonce;
    }

    function verifyDuplication(address[] memory _signers) internal pure returns (bool){
        uint len = _signers.length;
        if (len < 2) {
            return true;
        }
        for (uint i = 0; i < len - 1; i++) {
            if (_signers[i] >= _signers[i + 1]) {
                return false;
            }
        }
        return true;
    }

    function verifyMajorSigners(address[] memory _signers) internal view returns (bool){
        uint verified = 0;
        uint len = _signers.length;
        for (uint i = 0; i < len; i++) {
            if (signerMap[_signers[i]]) {
                verified++;
            }
        }
        if (verified > signerArr.length * 2 / 3) {
            return true;
        }
        return false;
    }

    function verifySign(SigProof memory _sigProof) internal pure returns (bool){
        bytes32 hash = keccak256(abi.encodePacked(_sigProof.rootNonce, _sigProof.root));

        uint len = _sigProof.signers.length;
        for (uint i = 0; i < len; i++) {
            if (_sigProof.signers[i] != ECDSA.recover(hash, _sigProof.signatures[i])) {
                return false;
            }
        }
        return true;
    }

    function verifySignersMerkle(bytes32 root, SignersMerkleProof memory _signersProof) internal pure returns (bool){
        bytes32 hash = keccak256(abi.encodePacked(_signersProof.signers));
        return MerkleProof.verify(_signersProof.proof, root, hash);
    }
}
