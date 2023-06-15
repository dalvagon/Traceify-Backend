// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "./utils/Roles.sol";

contract ProductHistory is Roles {
    struct Product {
        bytes32 uid;
        uint256 timestamp;
        string name;
        string category;
        string manufacturer;
        string manufacturingDate;
        string expiryDate;
        string description;
        bytes32[] parentUids;
    }

    struct Operation {
        bytes32 uid;
        uint256 timestamp;
        string name;
        string category;
        string date;
        string description;
        bytes32[] operationProducts;
    }

    mapping(bytes32 => Product) private products;
    mapping(bytes32 => Operation[]) private operations;
    mapping(address => bytes32[]) private productsForManager;

    event ProductCreated(bytes32 uid, uint256 timestamp);
    event OperationAdded(bytes32 uid, uint256 timestamp);
    event ManagerAdded(address account);
    event ManagerRemoved(address account);

    function createProduct(
        bytes32 uid,
        string memory name,
        string memory category,
        string memory manufacturer,
        string memory manufacturingDate,
        string memory expiryDate,
        string memory description,
        bytes32[] memory parentUids
    ) external onlyRole(MANAGER_ROLE) {
        require(products[uid].timestamp == 0, "Product already exists");

        Product memory product = Product({
            uid: uid,
            timestamp: block.timestamp,
            name: name,
            category: category,
            manufacturer: manufacturer,
            manufacturingDate: manufacturingDate,
            expiryDate: expiryDate,
            description: description,
            parentUids: parentUids
        });

        products[uid] = product;
        productsForManager[msg.sender].push(uid);

        emit ProductCreated(uid, block.timestamp);
    }

    function addOperation(
        bytes32 uid,
        string memory name,
        string memory category,
        string memory date,
        string memory description,
        bytes32[] memory operationProducts
    ) external onlyRole(MANAGER_ROLE) {
        require(
            products[uid].timestamp != 0,
            "Product with this UID does not exist"
        );
        require(
            _isManagerForProduct(uid, msg.sender),
            "You are not a manager of this product"
        );

        Operation memory operation = Operation({
            uid: uid,
            timestamp: block.timestamp,
            name: name,
            category: category,
            date: date,
            description: description,
            operationProducts: operationProducts
        });

        operations[uid].push(operation);

        emit OperationAdded(uid, block.timestamp);
    }

    function addManagerForProduct(
        bytes32 uid,
        address account
    ) external onlyRole(MANAGER_ROLE) {
        require(
            products[uid].timestamp != 0,
            "Product with this UID does not exist"
        );
        require(
            _isManagerForProduct(uid, msg.sender),
            "You are not a manager of this product"
        );
        require(
            !_isManagerForProduct(uid, account),
            "This account is already a manager of this product"
        );

        productsForManager[account].push(uid);

        emit ManagerAdded(account);
    }

    function renounceRoleForProduct(
        bytes32 uid
    ) external onlyRole(MANAGER_ROLE) {
        require(
            products[uid].timestamp != 0,
            "Product with this UID does not exist"
        );
        require(
            _isManagerForProduct(uid, msg.sender),
            "You are not a manager of this product"
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
        require(
            products[uid].timestamp != 0,
            "Product with this UID does not exist"
        );

        return products[uid];
    }

    function getOperations(
        bytes32 uid
    ) external view returns (Operation[] memory) {
        require(
            products[uid].timestamp != 0,
            "Product with this UID does not exist"
        );

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
