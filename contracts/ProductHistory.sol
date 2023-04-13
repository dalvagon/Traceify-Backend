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
        bytes32[] parentBarcodes;
    }

    mapping(bytes32 => Product) private products;
    mapping(bytes32 => Operation[]) operations;

    function addProduct(
        bytes32 barcode,
        bytes32 informationHash,
        bytes32[] calldata parentBarcodes
    ) external onlyRole(MANAGER_ROLE) {
        require(
            products[barcode].informationHash == 0,
            "Product with this barcode already exists"
        );

        for (uint256 i = 0; i < parentBarcodes.length; i++) {
            require(
                products[parentBarcodes[i]].informationHash != 0,
                "Parent product with this barcode does not exist"
            );
        }

        Product memory product = Product({
            manager: msg.sender,
            informationHash: informationHash,
            parentBarcodes: parentBarcodes
        });

        products[barcode] = product;
    }

    function updateProduct(
        bytes32 barcode,
        bytes32 informationHash,
        uint256 timestamp
    ) external onlyRole(MANAGER_ROLE) {
        require(
            products[barcode].informationHash != 0,
            "Product with this barcode does not exist"
        );
        require(
            products[barcode].manager == msg.sender,
            "User is not manager of this product"
        );

        Operation memory operation = Operation({
            informationHash: informationHash,
            timestamp: timestamp
        });

        operations[barcode].push(operation);
    }

    function getProduct(
        bytes32 barcode
    ) external view returns (bytes32, bytes32[] memory, Operation[] memory) {
        Product memory product = products[barcode];
        Operation[] memory productOperations = operations[barcode];

        return (
            product.informationHash,
            product.parentBarcodes,
            productOperations
        );
    }
}
