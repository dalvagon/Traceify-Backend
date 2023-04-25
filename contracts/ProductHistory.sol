// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "./utils/Roles.sol";

contract ProductHistory is Roles {
    struct Operation {
        bytes32 informationHash;
        uint256 timestamp;
    }

    struct Product {
        address manager;
        bytes32 informationHash;
        bytes32[] parentUIDs;
        uint256 timestamp;
    }

    bytes32[] private productUIDs;
    mapping(bytes32 => Product) private products;
    mapping(bytes32 => Operation[]) operations;

    function addProduct(
        bytes32 uid,
        bytes32 informationHash,
        bytes32[] calldata parentUIDs
    ) external onlyRole(MANAGER_ROLE) {
        require(
            products[uid].informationHash == 0,
            "Product with this uid already exists"
        );

        for (uint256 i = 0; i < parentUIDs.length; i++) {
            require(
                products[parentUIDs[i]].informationHash != 0,
                "Parent product with this uid does not exist"
            );
        }

        Product memory product = Product({
            manager: msg.sender,
            informationHash: informationHash,
            parentUIDs: parentUIDs,
            timestamp: block.timestamp
        });

        products[uid] = product;
        productUIDs.push(uid);
    }

    function getManagerProducts() external view returns (bytes32[] memory) {
        bytes32[] memory managerProducts = new bytes32[](
            getManagerProductCount()
        );
        uint256 managerProductsCount = 0;

        for (uint256 i = 0; i < productUIDs.length; i++) {
            if (products[productUIDs[i]].manager == msg.sender) {
                managerProducts[managerProductsCount] = productUIDs[i];
                managerProductsCount++;
            }
        }

        return managerProducts;
    }

    function transferProductOwnership(
        bytes32 uid,
        address newManager
    ) external onlyRole(MANAGER_ROLE) {
        require(
            products[uid].informationHash != 0,
            "Product with this uid does not exist"
        );
        require(
            products[uid].manager == msg.sender,
            "User is not manager of this product"
        );

        products[uid].manager = newManager;
    }

    function updateProduct(
        bytes32 uid,
        bytes32 informationHash
    ) external onlyRole(MANAGER_ROLE) {
        require(
            products[uid].informationHash != 0,
            "Product with this uid does not exist"
        );
        require(
            products[uid].manager == msg.sender,
            "User is not manager of this product"
        );

        Operation memory operation = Operation({
            informationHash: informationHash,
            timestamp: block.timestamp
        });

        operations[uid].push(operation);
    }

    function getProduct(
        bytes32 uid
    )
        external
        view
        returns (bytes32, bytes32[] memory, Operation[] memory, uint256)
    {
        Product memory product = products[uid];
        Operation[] memory productOperations = operations[uid];

        return (
            product.informationHash,
            product.parentUIDs,
            productOperations,
            product.timestamp
        );
    }

    function generateProductUID()
        external
        view
        onlyRole(MANAGER_ROLE)
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(block.timestamp, msg.sender));
    }

    function getManagerProductCount() internal view returns (uint256) {
        uint256 managerProductCount = 0;

        for (uint256 i = 0; i < productUIDs.length; i++) {
            if (products[productUIDs[i]].manager == msg.sender) {
                managerProductCount++;
            }
        }

        return managerProductCount;
    }
}
