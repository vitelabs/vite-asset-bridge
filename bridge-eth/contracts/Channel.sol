// // contracts/Keeper.sol
// // SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.3;

interface IChannel {
    function spent(bytes32 id) external view returns (bool);

    function output(
        bytes32 id,
        address payable dest,
        uint256 value
    ) external;
}
