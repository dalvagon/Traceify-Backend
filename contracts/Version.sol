// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "hardhat/console.sol";
import "./utils/Roles.sol";

contract Version is Roles {
    uint32 version;

    constructor() {}

    function updateVersion() external onlyRole(MANAGER_ROLE) {
        version++;
    }

    function getVersion() external view returns (uint32) {
        return version;
    }
}
