// contracts/Vault.sol
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Token is ERC20 {
    constructor() ERC20("TTTT", "TTTT") {
        _mint(msg.sender, 1000000 * (10**uint256(decimals())));
    }
}
