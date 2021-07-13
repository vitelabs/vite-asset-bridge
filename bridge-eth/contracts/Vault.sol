// contracts/Vault.sol
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.3;
import "@openzeppelin/contracts/access/Ownable.sol";

interface IVault {
    event Input(bytes32 id, address dest, uint256 value);
    event Output(address src, bytes dest, uint256 value);

    /**
     *
     */
    function input(
        bytes32 id,
        address dest,
        uint256 value
    ) external;

    function output(
        address src,
        bytes calldata dest,
        uint256 value
    ) external payable;
}

contract Vault is IVault, Ownable {
    function input(
        bytes32 id,
        address dest,
        uint256 value
    ) public override onlyOwner {
        _transfer(dest, value);
        emit Input(id, dest, value);
    }

    function _transfer(address dest, uint256 value) internal {
        (bool success, ) = dest.call{value: value}("");
        require(success, "Transfer failed.");
    }

    function output(
        address src,
        bytes calldata dest,
        uint256 value
    ) public payable override {
        _requireTransfer(src, value);

        emit Output(src, dest, value);
    }

    function _requireTransfer(address src, uint256 value) internal {
        require(msg.value == value, "Transfer Require failed.");
    }

    receive() external payable {}
}
