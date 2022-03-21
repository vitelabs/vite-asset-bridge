// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./Keeper.sol";

interface IVault {
    function spent(bytes32 _hash) external view returns (bool);

    function input(
        uint256 id,
        bytes calldata dest,
        uint256 value
    ) external;

    function output(
        uint256 id,
        bytes32 outputHash,
        address payable dest,
        uint256 value
    ) external;

    function newChannel(IERC20 _erc20, IKeeper _keeper)
        external
        returns (uint256);
}

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
        uint256 id,
        bytes32 _hash,
        bytes dest,
        uint256 value,
        address from
    );
    event Output(uint256 id, bytes32 _hash, address dest, uint256 value);

    function spent(bytes32 _hash) public view override returns (bool) {
        return spentHashes[_hash];
    }

    function newChannel(IERC20 _erc20, IKeeper _keeper)
        public
        override
        returns (uint256)
    {
        bytes32 _inputHash = keccak256(
            abi.encodePacked(uint256(0), channels.length, _erc20)
        );
        bytes32 _outputHash = keccak256(
            abi.encodePacked(uint256(1), channels.length, _erc20)
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
        require(!spentHashes[_outputHash], "spent verify failed");
        spentHashes[_outputHash] = true;
        emit LogChannelsAddition(channels.length - 1, _erc20);
        return channels.length;
    }

    function input(
        uint256 id,
        bytes calldata dest,
        uint256 value
    ) public override {
        Channel memory channel = channels[id];

        SafeERC20.safeTransferFrom(
            channel.erc20,
            msg.sender,
            address(this),
            value
        );

        bytes32 nextHash = keccak256(
            abi.encodePacked(channel.inputId, dest, value, channel.inputHash)
        );

        emit Input(channel.inputId + 1, nextHash, dest, value, msg.sender);
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

        require(!spentHashes[nextHash], "spent verify failed");
        spentHashes[nextHash] = true;

        SafeERC20.safeTransfer(channel.erc20, dest, value);

        emit Output(channel.outputId + 1, nextHash, dest, value);
        channels[id].outputId = channel.outputId + 1;
        channels[id].outputHash = nextHash;
    }

    receive() external payable {}
}
