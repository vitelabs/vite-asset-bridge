pragma solidity ^0.6.3;

// 3.1.0
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/presets/ERC20PresetMinterPauser.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Capped.sol";


contract MockERC20Token is ERC20Capped, ERC20PresetMinterPauser {

    uint256 private erc20_decimals = 18;
    uint256 private erc20_units = 10**erc20_decimals;

    constructor()
    ERC20PresetMinterPauser("Mock ERC20 Token", "MOCK")
    ERC20Capped(1000000*erc20_units) public{
    }

    /**
    * @dev See {ERC20-_beforeTokenTransfer}.
    */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override(ERC20PresetMinterPauser, ERC20Capped) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
