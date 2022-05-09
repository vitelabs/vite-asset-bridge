// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./Keeper.sol";
import "./Vault.sol";

struct Channel {
    uint256 inputId;
    bytes32 inputHash;
    uint256 outputId;
    bytes32 outputHash;
    IERC20 erc20;
    IKeeper keeper;
}

contract Vault is IVault {
    Channel[] public channels;
    mapping(bytes32 => bool) public spentHashes;

    event LogChannelsAddition(uint256 indexed id, IERC20 indexed token);
    event Input(
        uint256 channelId,
        uint256 index,
        bytes32 inputHash,
        bytes dest,
        uint256 value,
        address from
    );
    event Output(
        uint256 channelId,
        uint256 index,
        bytes32 outputHash,
        address dest,
        uint256 value
    );

    constructor(IKeeper _keeper) {
        newChannel(IERC20(0x00), _keeper);
    }

    function spent(bytes32 _hash) public view override returns (bool) {
        return spentHashes[_hash];
    }

    function newChannel(IERC20 _erc20, IKeeper _keeper)
        public
        override
        returns (uint256)
    {
        bytes32 _inputHash = keccak256(
            abi.encodePacked(uint256(0), block.number, channels.length, _erc20)
        );
        bytes32 _outputHash = keccak256(
            abi.encodePacked(uint256(1), block.number, channels.length, _erc20)
        );

        return newChannelWithHash(_erc20, _keeper, _inputHash, _outputHash);
    }

    function newChannelWithHash(
        IERC20 _erc20,
        IKeeper _keeper,
        bytes32 _inputHash,
        bytes32 _outputHash
    ) public returns (uint256) {
        channels.push(
            Channel({
                inputId: 0,
                inputHash: _inputHash,
                outputId: 0,
                outputHash: _outputHash,
                erc20: _erc20,
                keeper: _keeper
            })
        );
        requireAndUpdateSpentHashes(_inputHash);
        requireAndUpdateSpentHashes(_outputHash);

        emit LogChannelsAddition(channels.length - 1, _erc20);
        return channels.length;
    }

    function input(
        uint256 id,
        bytes calldata dest,
        uint256 value
    ) public payable override {
        Channel memory channel = channels[id];

        if (id == 0) {
            require(msg.value == value, "Transfer Require failed.");
        } else {
            SafeERC20.safeTransferFrom(
                channel.erc20,
                msg.sender,
                address(this),
                value
            );
        }

        bytes32 nextHash = keccak256(
            abi.encodePacked(channel.inputId, dest, value, channel.inputHash)
        );

        requireAndUpdateSpentHashes(nextHash);

        emit Input(id, channel.inputId + 1, nextHash, dest, value, msg.sender);
        channels[id].inputId = channel.inputId + 1;
        channels[id].inputHash = nextHash;
    }

    function output(
        uint256 id,
        bytes32 outputHash,
        address payable dest,
        uint256 value
    ) public override {
        Channel memory channel = channels[id];

        bytes32 nextHash = keccak256(
            abi.encodePacked(channel.outputId, dest, value, channel.outputHash)
        );
        // bytes32 nextId = keccak256(abi.encodePacked(dest));
        require(nextHash == outputHash, "hash verify failed");

        channel.keeper.approved(outputHash);

        requireAndUpdateSpentHashes(nextHash);

        if (id == 0) {
            dest.transfer(value);
        } else {
            SafeERC20.safeTransfer(channel.erc20, dest, value);
        }

        emit Output(id, channel.outputId + 1, nextHash, dest, value);
        channels[id].outputId = channel.outputId + 1;
        channels[id].outputHash = nextHash;
    }

    function requireAndUpdateSpentHashes(bytes32 _hash) internal {
        require(!spentHashes[_hash], "spent hash verify failed");
        spentHashes[_hash] = true;
    }

    receive() external payable {}
}
