pragma solidity ^0.6.3;
pragma experimental ABIEncoderV2; // todo delete

interface Vite {
    struct ViteTx {
        string hash;
    }

    struct ViteMerkleTreeInfo {
        string root;
    }

    struct ViteSignerInfo {
        string data;
        string signer;
    }

//    struct MerkleProof {
//        bytes32 root;
//        bytes32 leaf;
//        bytes32[] proof;
//    }

    struct NonceMerkleProof {
        uint64 nonce;
        bytes32[] proof;
    }

    struct SigProof {
        uint64 rootNonce;
        bytes32 root;
        bytes[] signatures;
        address[] signers;
    }


    struct SignersMerkleProof {
        address[] signers; // to leaf hash
        bytes32[] proof;
    }

    struct TxMerkleProof {
        bytes32 txHash; // tx leaf hash
        bytes32[] proof; //
    }

    // 1. 证明sigProof的有效性(签名合法 && signer在上次25名中)
    // 2. 证明nonceProof和signersProof能通过sigProof中的merkle proof证明
    function submitSigners(
        SigProof calldata sigProof,
        SignersMerkleProof calldata signersProof
    ) external;

    function submitProof(
        SigProof calldata sigProof
    ) external;

//    function txApproved(
//        uint64 viteNonce,
//        TxMerkleProof calldata txProof
//    ) external view returns (bool);
}

//1. 提交sbp列表，其中高度信息包含在sbp签名的merkle proof中，新的sbp列表也包含在merkle proof中；
//2. 提交withdrawTxs列表，这个信息应该能够通过merkle proof证明，而不是sbp证明；所有过程1中，应该还需要提交withdraw列表的merkle proof
