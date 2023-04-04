// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "hardhat/console.sol";

contract Version {
    address private _owner;
    uint32 version;
    mapping(address => bool) owners;

    constructor() {
        _owner = msg.sender;
        version = 0;
        owners[_owner] = true;

        console.log("Version: %s", version);
    }

    function addOwner(address _newOwner) public {
        if (_owner == msg.sender) {
            if (owners[_newOwner]) {
                console.log("Owner already exists");
                return;
            }

            console.log("Added owner: ", _newOwner);
            owners[_newOwner] = true;
        } else {
            console.log("Only owner can add new owner");
        }
    }

    function getVersion() public view returns (uint32) {
        return version;
    }

    function updateVersion() public {
        if (owners[msg.sender]) {
            version++;
        } else {
            console.log("Only owners can update version");
        }
    }

    function getOwners() public view returns (address[] memory) {}
}
