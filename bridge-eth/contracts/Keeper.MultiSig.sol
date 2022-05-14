// contracts/MultiSigKeeper.sol
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.3;
pragma experimental ABIEncoderV2;
import "./Keeper.sol";
import "./Vault.sol";

contract KeeperMultiSig is IKeeper {
    uint8 public threshold;

    mapping(address => bool) public keepers;
    mapping(bytes32 => bool) public approvedIds;

    event Approved(bytes32 id);

    constructor(address[] memory _addrs, uint8 _threshold) {
        uint256 len = _addrs.length;
        require(len >= _threshold, "threshold required");
        for (uint256 i = 0; i < len; i++) {
            keepers[_addrs[i]] = true;
        }
        threshold = _threshold;
    }

    function approved(bytes32 id) public view override {
        require(approvedIds[id], "revert id approved");
    }

    function isKeeper(address addr) public view returns (bool) {
        return keepers[addr];
    }

    // Note that address recovered from signatures must be strictly increasing, in order to prevent duplicates
    function approveId(
        uint8[] calldata sigV,
        bytes32[] calldata sigR,
        bytes32[] calldata sigS,
        bytes32 id
    ) public {
        _approveId(sigV, sigR, sigS, id);
    }

    function _approveId(
        uint8[] calldata sigV,
        bytes32[] calldata sigR,
        bytes32[] calldata sigS,
        bytes32 id
    ) internal {
        require(sigR.length == threshold, "threshold required");
        require(
            sigR.length == sigS.length && sigR.length == sigV.length,
            "length reqired"
        );
        address lastAdd = address(0); // cannot have address(0) as an owner
        for (uint256 i = 0; i < threshold; i++) {
            address recovered = ecrecover(id, sigV[i], sigR[i], sigS[i]);
            require(
                recovered > lastAdd && keepers[recovered],
                "signature required"
            );
            lastAdd = recovered;
        }
        approvedIds[id] = true;
        emit Approved(id);
    }

    function approveAndExecOutput(
        uint8[] calldata sigV,
        bytes32[] calldata sigR,
        bytes32[] calldata sigS,
        uint256 channelId,
        bytes32 outputHash,
        address payable dest,
        uint256 value,
        IVault vault
    ) public {
        _approveId(sigV, sigR, sigS, outputHash);
        if (!approvedIds[outputHash]) {
            return;
        }
        if (!vault.spent(outputHash)) {
            vault.output(channelId, outputHash, dest, value);
        }
    }
}
