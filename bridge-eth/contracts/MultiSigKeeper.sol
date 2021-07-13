// contracts/MultiSigKeeper.sol
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.3;
pragma experimental ABIEncoderV2;
import "./Keeper.sol";

contract MultiSigKeeper is Keeper {
    // keccak256("1"+tokenId)
    bytes32 constant SALT =
        0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6;
    bytes32 prevHash = 0x0;
    uint8 threshold;
    IVault vault;

    mapping(address => bool) keepers;

    constructor(
        address _vault,
        address[] memory _addrs,
        uint8 _threshold
    ) {
        vault = IVault(_vault);
        uint256 len = _addrs.length;
        require(len > _threshold, "threshold required");
        for (uint256 i = 0; i < len; i++) {
            keepers[_addrs[i]] = true;
        }
        threshold = _threshold;
    }

    function _submitInput(
        bytes32 id,
        address dest,
        uint256 value
    ) public {
        vault.input(id, dest, value);
    }

    // Note that address recovered from signatures must be strictly increasing, in order to prevent duplicates
    function submitInput(
        uint8[] calldata sigV,
        bytes32[] calldata sigR,
        bytes32[] calldata sigS,
        address dest,
        uint256 value
    ) public {
        require(sigR.length == threshold, "threshold required");
        require(
            sigR.length == sigS.length && sigR.length == sigV.length,
            "length reqired"
        );

        // EIP712 scheme: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
        bytes32 txInputHash = keccak256(
            abi.encodePacked(SALT, dest, value, prevHash)
        );

        address lastAdd = address(0); // cannot have address(0) as an owner
        for (uint256 i = 0; i < threshold; i++) {
            address recovered = ecrecover(
                txInputHash,
                sigV[i],
                sigR[i],
                sigS[i]
            );
            require(recovered > lastAdd && keepers[recovered]);
            lastAdd = recovered;
        }
        prevHash = txInputHash;
        _submitInput(txInputHash, dest, value);
    }
}
