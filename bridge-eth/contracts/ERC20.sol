// contracts/ERC20Token.sol
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.3;

// @openzeppelin/contracts@v3.3.0
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";

contract ERC20Token is ERC20PresetMinterPauser {
    constructor(string memory name, string memory symbol)
        public
        ERC20PresetMinterPauser(name, symbol)
    {}

    /**
     * @dev See {ERC20-_beforeTokenTransfer}.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20PresetMinterPauser) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
