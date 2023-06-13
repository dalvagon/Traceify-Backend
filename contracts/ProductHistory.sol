// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "./utils/Roles.sol";

contract ProductHistory is Roles {
    struct Product {
        bytes32 uid;
        bytes32 ipfsHash;
        uint256 timestamp;
    }

    struct Operation {
        bytes32 uid;
        bytes32 ipfsHash;
        uint256 timestamp;
    }

    mapping(bytes32 => Product) private products;
    mapping(bytes32 => Operation[]) private operations;
    mapping(address => bytes32[]) private productsForManager;

    event ProductCreated(bytes32 uid, bytes32 ipfsHash, uint256 timestamp);
    event OperationAdded(bytes32 uid, bytes32 ipfsHash, uint256 timestamp);
    event ManagerAdded(address account);
    event ManagerRemoved(address account);

    function createProduct(
        bytes32 uid,
        bytes32 ipfsHash
    ) external onlyRole(MANAGER_ROLE) {
        require(products[uid].ipfsHash == 0, "Product already exists");

        Product memory product = Product({
            uid: uid,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp
        });

        products[uid] = product;
        productsForManager[msg.sender].push(uid);

        emit ProductCreated(uid, ipfsHash, block.timestamp);
    }

    function addOperation(
        bytes32 uid,
        bytes32 ipfsHash
    ) external onlyRole(MANAGER_ROLE) {
        require(products[uid].ipfsHash != 0, "Product does not exist");
        require(
            _isManagerForProduct(uid, msg.sender),
            "Not a manager of this product"
        );

        Operation memory operation = Operation({
            uid: uid,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp
        });

        operations[uid].push(operation);

        emit OperationAdded(uid, ipfsHash, block.timestamp);
    }

    function addManagerForProduct(
        bytes32 uid,
        address account
    ) external onlyRole(MANAGER_ROLE) {
        require(products[uid].ipfsHash != 0, "Product does not exist");
        require(!_isManagerForProduct(uid, account), "Already a manager");
        require(hasRole(MANAGER_ROLE, account), "The account is not a manager");
        require(
            _isManagerForProduct(uid, msg.sender),
            "Not a manager of this product"
        );

        productsForManager[account].push(uid);

        emit ManagerAdded(account);
    }

    function renounceRoleForProduct(
        bytes32 uid
    ) external onlyRole(MANAGER_ROLE) {
        require(products[uid].ipfsHash != 0, "Product does not exist");
        require(
            _isManagerForProduct(uid, msg.sender),
            "Not a manager of this product"
        );

        for (uint256 i = 0; i < productsForManager[msg.sender].length; i++) {
            if (productsForManager[msg.sender][i] == uid) {
                _removeFromArray(
                    productsForManager[msg.sender],
                    productsForManager[msg.sender][i]
                );

                break;
            }
        }

        emit ManagerRemoved(msg.sender);
    }

    function getProduct(bytes32 uid) external view returns (Product memory) {
        require(products[uid].ipfsHash != 0, "Product does not exist");

        return products[uid];
    }

    function getOperations(
        bytes32 uid
    ) external view returns (Operation[] memory) {
        require(products[uid].ipfsHash != 0, "Product does not exist");

        return operations[uid];
    }

    function getProducts()
        external
        view
        onlyRole(MANAGER_ROLE)
        returns (bytes32[] memory)
    {
        return productsForManager[msg.sender];
    }

    function generateProductUID()
        external
        view
        onlyRole(MANAGER_ROLE)
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(block.timestamp, msg.sender));
    }

    function _isManagerForProduct(
        bytes32 uid,
        address account
    ) internal view returns (bool) {
        for (uint256 i = 0; i < productsForManager[account].length; i++) {
            if (productsForManager[account][i] == uid) {
                return true;
            }
        }

        return false;
    }
}
