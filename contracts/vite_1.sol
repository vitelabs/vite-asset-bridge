pragma solidity ^0.6.3;
pragma experimental ABIEncoderV2; // todo delete

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/cryptography/MerkleProof.sol";
import "./interfaces.sol";


contract ViteProxyV01 is Vite {
    mapping(uint64 => bytes32) public nonceRoot;

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
        uint64 _viteNonce,
        TxMerkleProof memory _txProof
    ) public view returns (bool) {
        require(_viteNonce <= viteNonce, "error viteNonce");
        return MerkleProof.verify(_txProof.proof, nonceRoot[_viteNonce], _txProof.txHash);
    }

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


        _updateSigners(_signersProof.signers);
        _updateNonceRoot(_sigProof.rootNonce, _sigProof.root);
    }

    function submitProof(
        SigProof memory _sigProof
    ) public override {
        require(verifyDuplication(_sigProof.signers), "signer duplicated");
        require(verifyMajorSigners(_sigProof.signers), "major signer");
        require(verifySign(_sigProof), "sign failed");

        // 更新高度和merkle root信息
        _updateNonceRoot(_sigProof.rootNonce, _sigProof.root);
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

    function _updateNonceRoot(uint64 _nonce, bytes32 _root) internal {
        require(_nonce == viteNonce + 1, "nonce check");
        nonceRoot[_nonce] = _root;
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
