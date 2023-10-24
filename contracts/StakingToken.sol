// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingToken is ERC20, Ownable {
    constructor() ERC20("Staking Token", "ST") {
        decimals();
    }

    function decimals() public view virtual override returns (uint8) {
        return 12;
    }

    function mint(address user, uint amount) public onlyOwner {
        _mint(user, amount);
    }
}
