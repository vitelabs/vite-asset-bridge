// // contracts/Vault.sol
// // SPDX-License-Identifier: GPL-3.0
// pragma solidity ^0.7.3;
// import "@openzeppelin/contracts/access/Ownable.sol";

// interface IVault {
//     // event Input(bytes32 id, address dest, uint256 value);
//     // event Output(bytes32 id, address src, bytes dest, uint256 value);

//     // /**
//     //  *
//     //  */
//     // function input(
//     //     bytes32 id,
//     //     address dest,
//     //     uint256 value
//     // ) external;

//     // function output(
//     //     address src,
//     //     bytes calldata dest,
//     //     uint256 value
//     // ) external payable;

//     event Input(
//         uint256 index,
//         bytes32 id,
//         address src,
//         bytes dest,
//         uint256 value
//     );
// }

// contract Vault is IVault, Ownable {
//     // function input(
//     //     bytes32 id,
//     //     address dest,
//     //     uint256 value
//     // ) public override onlyOwner {
//     //     _transfer(dest, value);
//     //     emit Input(id, dest, value);
//     // }

//     // function _transfer(address dest, uint256 value) internal {
//     //     (bool success, ) = dest.call{value: value}("");
//     //     require(success, "Transfer failed.");
//     // }

//     // bytes32 public salt;
//     // bytes32 public prevId = 0x0;

//     // constructor(bytes32 _salt) {
//     //     salt = _salt;
//     // }

//     uint256 public inputIndex;
//     bytes public prevInputId;

//     function input(bytes calldata dest, uint256 value) public payable override {
//         _requireTransfer(src, value);

//         bytes32 id = keccak256(
//             abi.encodePacked(inputIndex, dest, value, prevInputId)
//         );

//         intputIndex = intputIndex + 1;
//         emit Input(intputIndex, id, dest, value);
//         prevInputId = id;
//     }

//     function _requireTransfer(uint256 value) internal {
//         require(msg.value == value, "Transfer Require failed.");
//     }

//     receive() external payable {}
// }
