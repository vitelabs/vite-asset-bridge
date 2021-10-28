// // contracts/MultiSigKeeper.sol
// // SPDX-License-Identifier: GPL-3.0
// pragma solidity ^0.7.3;
// pragma experimental ABIEncoderV2;
// import "./Keeper.sol";

// contract MultiSigKeeper is IKeeper {
//     // keccak256("1"+tokenId)
//     bytes32 public SALT;
//     bytes32 public prevHash = 0x0;
//     uint8 public threshold;
//     IVault public vault;

//     mapping(address => bool) public keepers;

//     constructor(
//         bytes32 _salt,
//         address _vault,
//         address[] memory _addrs,
//         uint8 _threshold
//     ) {
//         SALT = _salt;
//         vault = IVault(_vault);
//         uint256 len = _addrs.length;
//         require(len > _threshold, "threshold required");
//         for (uint256 i = 0; i < len; i++) {
//             keepers[_addrs[i]] = true;
//         }
//         threshold = _threshold;
//     }

//     function _submitInput(
//         bytes32 id,
//         address dest,
//         uint256 value
//     ) public {
//         vault.input(id, dest, value);
//     }

//     // Note that address recovered from signatures must be strictly increasing, in order to prevent duplicates
//     function submitInput(
//         uint8[] calldata sigV,
//         bytes32[] calldata sigR,
//         bytes32[] calldata sigS,
//         address dest,
//         uint256 value
//     ) public {
//         require(sigR.length == threshold, "threshold required");
//         require(
//             sigR.length == sigS.length && sigR.length == sigV.length,
//             "length reqired"
//         );

//         bytes32 txInputHash = keccak256(
//             abi.encodePacked(SALT, dest, value, prevHash)
//         );

//         address lastAdd = address(0); // cannot have address(0) as an owner
//         for (uint256 i = 0; i < threshold; i++) {
//             address recovered = ecrecover(
//                 txInputHash,
//                 sigV[i],
//                 sigR[i],
//                 sigS[i]
//             );
//             require(
//                 recovered > lastAdd && keepers[recovered],
//                 "signature required"
//             );
//             lastAdd = recovered;
//         }
//         prevHash = txInputHash;
//         _submitInput(txInputHash, dest, value);
//     }
// }
