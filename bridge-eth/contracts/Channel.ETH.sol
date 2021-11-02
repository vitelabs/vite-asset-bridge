// contracts/Vault.sol
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.3;

contract ChannelETH {
    event Input(uint256 index, bytes32 id, bytes dest, uint256 value);

    uint256 public inputIndex;
    bytes32 public prevInputId;

    function input(bytes calldata dest, uint256 value) public payable {
        _requireTransfer(value);

        bytes32 id = keccak256(
            abi.encodePacked(inputIndex, dest, value, prevInputId)
        );

        inputIndex = inputIndex + 1;
        emit Input(inputIndex, id, dest, value);
        prevInputId = id;
    }

    function _requireTransfer(uint256 value) internal {
        require(msg.value == value, "Transfer Require failed.");
    }

    // -----------------------------------------------------------
    // -----------------------------------------------------------
    // -----------------------------------------------------------

    uint256 public outputIndex;
    bytes32 public prevOutputId;
    mapping(bytes32 => bool) public blockedOutputIds;

    event Output(uint256 index, bytes32 id, address dest, uint256 value);

    function output(
        bytes32 id,
        address payable dest,
        uint256 value
    ) public payable {
        bytes32 nextId = keccak256(
            abi.encodePacked(outputIndex, dest, value, prevOutputId)
        );
        // bytes32 nextId = keccak256(abi.encodePacked(dest));
        require(nextId == id, "id verify failed");
        require(!blockedOutputIds[nextId], "block verify failed");
        blockedOutputIds[nextId] = true;
        dest.transfer(value);
        outputIndex = outputIndex + 1;
        prevOutputId = nextId;
        emit Output(outputIndex, id, dest, value);
    }

    receive() external payable {}
}
