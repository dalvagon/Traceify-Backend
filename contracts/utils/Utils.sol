// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

contract Utils {
    function _removeFromArray(bytes32[] storage array, bytes32 value) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == value) {
                array[i] = array[array.length - 1];
                array.pop();
            }
        }
    }
}
