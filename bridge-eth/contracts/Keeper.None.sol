// contracts/MultiSigKeeper.sol
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.3;
import "./Keeper.sol";

contract KeeperNone is IKeeper {
    function approved(bytes32 id) public view override {}
}
