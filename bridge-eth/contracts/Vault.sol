// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Keeper.sol";

interface IVault {
    function spent(bytes32 _hash) external view returns (bool);

    function input(
        uint256 id,
        bytes calldata dest,
        uint256 value
    ) external payable;

    function output(
        uint256 id,
        bytes32 outputHash,
        address payable dest,
        uint256 value
    ) external;

    function newChannel(IERC20 _erc20, IKeeper _keeper, int8 _decimalDiff, uint256 _minValue, uint256 _maxValue)
        external
        returns (uint256);
}
