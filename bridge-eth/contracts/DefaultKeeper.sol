// contracts/DefaultKeeper.sol
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.3;
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Keeper.sol";

contract DefaultKeeper is Keeper, Ownable {
    IVault vault;

    constructor(address _vault) {
        vault = IVault(_vault);
    }

    function input(
        bytes32 id,
        address dest,
        uint256 value
    ) public onlyOwner {
        vault.input(id, dest, value);
    }
}
