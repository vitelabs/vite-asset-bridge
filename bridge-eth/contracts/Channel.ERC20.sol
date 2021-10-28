// contracts/Vault.sol
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract ChannelERC20 {
    event Input(uint256 index, bytes32 id, bytes dest, uint256 value);

    uint256 public inputIndex;
    bytes32 public prevInputId;
    IERC20 public token;

    constructor(IERC20 _token) public {
        token = _token;
    }

    function input(bytes calldata dest, uint256 value) public payable {
        _requireTransfer(msg.sender, value);

        bytes32 id = keccak256(
            abi.encodePacked(inputIndex, dest, value, prevInputId)
        );

        inputIndex = inputIndex + 1;
        emit Input(inputIndex, id, dest, value);
        prevInputId = id;
    }

    function _requireTransfer(address from, uint256 value) internal {
        SafeERC20.safeTransferFrom(token, from, address(this), value);
    }

    // -----------------------------------------------------------
    // -----------------------------------------------------------
    // -----------------------------------------------------------

    uint256 public outputIndex;
    bytes32 public prevOutputId;

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

        SafeERC20.safeTransfer(token, dest, value);

        outputIndex = outputIndex + 1;
        prevOutputId = nextId;
        emit Output(outputIndex, id, dest, value);
    }

    receive() external payable {}
}
