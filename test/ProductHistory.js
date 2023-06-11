const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Product history productHistoryContract", function () {
    async function deployProductHistoryFixture() {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const ProductHistory = await ethers.getContractFactory("ProductHistory");
        productHistoryContract = await ProductHistory.deploy();

        return { productHistoryContract, owner, addr1, addr2, addr3 };
    }

    function getRandomHash() {
        return ethers.utils.formatBytes32String(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    }

    function getManagerRequest() {
        const informationHash = getRandomHash();
        return { informationHash };
    }

    async function addManager(address, productHistoryContract) {
        const { informationHash } = getManagerRequest();

        await productHistoryContract.connect(address).submitManagerRequest(informationHash);
        await productHistoryContract.approveManagerRequest(address.address);
    }

    function getProduct() {
        const informationHash = getRandomHash();
        const productOperations = [
            {
                informationHash: getRandomHash(),
            },
            {
                informationHash: getRandomHash(),
            }
        ];

        return {
            informationHash,
            productOperations
        };
    }

    it("Should be able to deploy ProductHistory contract", async function () {
        const { productHistoryContract } = await loadFixture(deployProductHistoryFixture);

        expect(productHistoryContract.address).to.properAddress;
    });


    it("Should be able to submit manager requests", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const managerReqquest = getManagerRequest();

        const res = productHistoryContract.connect(addr1).submitManagerRequest(managerReqquest.informationHash);

        await expect(res).to.emit(productHistoryContract, "ManagerRequestSubmitted").withArgs(addr1.address);
    });

    it("User should not be able to submit manager requests twice", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const managerReqquest = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(managerReqquest.informationHash);

        const res = productHistoryContract.connect(addr1).submitManagerRequest(managerReqquest.informationHash);

        await expect(res).to.be.revertedWith("Manager request already submitted");
    });

    it("Only admin should be able to approve manager requests", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const managerReqquest = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(managerReqquest.informationHash);

        const res = productHistoryContract.connect(addr2).approveManagerRequest(addr1.address);

        await expect(res).to.be.reverted;
    });

    it("Only admin should be able to reject manager requests", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const managerReqquest = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(managerReqquest.informationHash);

        const res = productHistoryContract.connect(addr2).rejectManagerRequest(addr1.address);

        await expect(res).to.be.reverted;
    });

    it("Admin should not be able to approve manager requests twice", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const managerReqquest = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(managerReqquest.informationHash);
        await productHistoryContract.approveManagerRequest(addr1.address);

        const res = productHistoryContract.approveManagerRequest(addr1.address);

        await expect(res).to.be.revertedWith("Manager request already approved");
    });

    it("Admin should not be able to accept a manager request that doesn't exist", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);

        const res = productHistoryContract.approveManagerRequest(addr1.address);

        await expect(res).to.be.revertedWith("Manager request does not exist");
    });

    it("Admin should not be able to reject a manager request that doesn't exist", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);

        const res = productHistoryContract.rejectManagerRequest(addr1.address);

        await expect(res).to.be.revertedWith("Manager request does not exist");
    });

    it("Admin should be able to approve manager requests", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const managerReqquest = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(managerReqquest.informationHash);

        const res = productHistoryContract.approveManagerRequest(addr1.address);

        await expect(res).to.emit(productHistoryContract, "ManagerRequestApproved").withArgs(addr1.address);
    });

    it("Admin should be able to reject manager requests", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const managerReqquest = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(managerReqquest.informationHash);

        const res = productHistoryContract.rejectManagerRequest(addr1.address);

        await expect(res).to.emit(productHistoryContract, "ManagerRequestDenied").withArgs(addr1.address);
    });

    it("Admin should be able to see manager requests addresses", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const managerReqquest = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(managerReqquest.informationHash);

        const res = await productHistoryContract.getManagerRequestAddresses();

        expect(res).to.be.an("array").that.includes(addr1.address);
    });

    it("Only admin should be able to see manager requests addresses", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const managerReqquest = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(managerReqquest.informationHash);
        await productHistoryContract.connect(addr2).submitManagerRequest(managerReqquest.informationHash);

        const res = productHistoryContract.connect(addr1).getManagerRequestAddresses();

        await expect(res).to.be.reverted;
    });

    it("Admin should be able to see approved manager requests addresses", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const managerReqquest = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(managerReqquest.informationHash);
        await productHistoryContract.connect(addr2).submitManagerRequest(managerReqquest.informationHash);
        await productHistoryContract.approveManagerRequest(addr1.address);

        const res = await productHistoryContract.getApprovedManagerRequestAddresses();

        expect(res).to.be.an("array").that.includes(addr1.address);
    });

    it("Only admin should be able to see approved manager requests addresses", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);

        const res = productHistoryContract.connect(addr1).getApprovedManagerRequestAddresses();

        await expect(res).to.be.reverted;
    });

    it("Admin should be able to see manager requests information", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const managerReqquest = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(managerReqquest.informationHash);

        const res = await productHistoryContract.getManagerRequest(addr1.address);

        expect(res).to.be.an("array").that.includes(managerReqquest.informationHash);
    });

    it("Only admin should be able to see manager requests information", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const managerReqquest = getManagerRequest();

        await productHistoryContract.connect(addr1).submitManagerRequest(managerReqquest.informationHash);

        const res = productHistoryContract.connect(addr2).getManagerRequest(addr1.address);

        await expect(res).to.be.reverted;
    });

    it("Only manager should be able to generate product uid", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);

        const res = productHistoryContract.connect(addr1).generateProductUID();

        await expect(res).to.be.reverted;
    });

    it("User that is not manager should not be able to add new products", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();

        const res = productHistoryContract.createProduct(uid, informationHash);

        await expect(res).to.be.reverted;
    });

    it("Shouldn't be able to add new products with the same uid", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid, informationHash);

        const res = productHistoryContract.connect(addr1).createProduct(uid, informationHash);

        await expect(res).to.be.revertedWith("Product already exists");
    });

    it("Manager should be able to add new products", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();

        const res = productHistoryContract.connect(addr1).createProduct(uid, informationHash);

        await expect(res).to.emit(productHistoryContract, "ProductCreated").withArgs(uid, informationHash, anyValue);
    });

    it("Manager should be able to add new product operations", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash, productOperations } = getProduct();
        await addManager(addr1, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid, informationHash);

        const res = productHistoryContract.connect(addr1).addOperation(uid, productOperations[0].informationHash);

        await expect(res).to.emit(productHistoryContract, "OperationAdded").withArgs(uid, productOperations[0].informationHash, anyValue);
    });

    it("Only manager should be able to add new product operations", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash, productOperations } = getProduct();
        await addManager(addr1, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid, informationHash);

        const res = productHistoryContract.connect(addr2).addOperation(uid, productOperations[0].informationHash);

        await expect(res).to.be.reverted;
    });

    it("Shouldn't be able to add new product operations to non existing product", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { productOperations } = getProduct();
        await addManager(addr1, productHistoryContract);

        const res = productHistoryContract.connect(addr1).addOperation(getRandomHash(), productOperations[0].informationHash);

        await expect(res).to.be.revertedWith("Product does not exist");
    });

    it("Only the managers of the product should be able to add new product operations", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash, productOperations } = getProduct();
        await addManager(addr1, productHistoryContract);
        await addManager(addr2, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid, informationHash);

        const res = productHistoryContract.connect(addr2).addOperation(uid, productOperations[0].informationHash);

        await expect(res).to.be.revertedWith("Not a manager of this product");
    });

    it("Product should be able to have multiple managers", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash, productOperations } = getProduct();
        await addManager(addr1, productHistoryContract);
        await addManager(addr2, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid, informationHash);
        await productHistoryContract.connect(addr1).addManagerForProduct(uid, addr2.address);
        await productHistoryContract.connect(addr1).addOperation(uid, productOperations[0].informationHash);

        const res = productHistoryContract.connect(addr2).addOperation(uid, productOperations[1].informationHash);

        await expect(res).to.emit(productHistoryContract, "OperationAdded").withArgs(uid, productOperations[1].informationHash, anyValue);
    });

    it("Shouldn't be able to add manager to non existing product", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        await addManager(addr1, productHistoryContract);

        const res = productHistoryContract.connect(addr1).addManagerForProduct(getRandomHash(), addr2.address);

        await expect(res).to.be.revertedWith("Product does not exist");
    });

    it("Only a manager should be able to add new manager to the product", async function () {
        const { productHistoryContract, addr1, addr2, addr3 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid, informationHash);

        const res = productHistoryContract.connect(addr2).addManagerForProduct(uid, addr3.address);

        await expect(res).to.be.reverted;
    });

    it("Shouldn't be able to add the same manager twice", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);
        await addManager(addr2, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid, informationHash);
        await productHistoryContract.connect(addr1).addManagerForProduct(uid, addr2.address);

        const res = productHistoryContract.connect(addr1).addManagerForProduct(uid, addr2.address);

        await expect(res).to.be.revertedWith("Already a manager");
    });

    it("A manager should only be able to add a user that is a manager", async function () {
        const { productHistoryContract, addr1, addr2, addr3 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);
        await addManager(addr2, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid, informationHash);

        const res = productHistoryContract.connect(addr1).addManagerForProduct(uid, addr3.address);

        await expect(res).to.be.revertedWith("The account is not a manager");
    });

    it("A manager should obly be able to add another manager for a product he owns", async function () {
        const { productHistoryContract, addr1, addr2, addr3 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);
        await addManager(addr2, productHistoryContract);
        await addManager(addr3, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid, informationHash);

        const res = productHistoryContract.connect(addr2).addManagerForProduct(uid, addr3.address);

        await expect(res).to.be.revertedWith("Not a manager of this product");
    });

    it("Only manager should be able to renounce the role for a product", async function () {
        const { productHistoryContract, addr1, addr2, addr3 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);
        await addManager(addr3, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid, informationHash);
        await productHistoryContract.connect(addr1).addManagerForProduct(uid, addr3.address);

        const res = productHistoryContract.connect(addr2).renounceRoleForProduct(uid);

        await expect(res).to.be.reverted;
    });

    it("Should be able to add manager to a product", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid, informationHash);

        const res = productHistoryContract.connect(addr1).addManagerForProduct(uid, addr2.address);

        await expect(res).to.emit(productHistoryContract, "ManagerAdded").withArgs(addr2.address);
    });

    it("Shouldn't be able to remove manager from non existing product", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        await addManager(addr1, productHistoryContract);

        const res = productHistoryContract.connect(addr1).renounceRoleForProduct(getRandomHash());

        await expect(res).to.be.revertedWith("Product does not exist");
    });

    it("Only a manager that owns a product can renounce the role", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);
        await addManager(addr2, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid, informationHash);

        const res = productHistoryContract.connect(addr2).renounceRoleForProduct(uid);

        await expect(res).to.be.revertedWith("Not a manager of this product");
    });

    it("Manager should be able to renounce the role over a product", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);
        await addManager(addr2, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid, informationHash);
        await productHistoryContract.connect(addr1).addManagerForProduct(uid, addr2.address);

        const res = productHistoryContract.connect(addr2).renounceRoleForProduct(uid);

        await expect(res).to.emit(productHistoryContract, "ManagerRemoved").withArgs(addr2.address);
    });

    it("Manager should be able to renounce the role over a product and add it again", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);
        await addManager(addr2, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid, informationHash);
        await productHistoryContract.connect(addr1).addManagerForProduct(uid, addr2.address);
        await productHistoryContract.connect(addr2).renounceRoleForProduct(uid);

        const res = productHistoryContract.connect(addr1).addManagerForProduct(uid, addr2.address);

        await expect(res).to.emit(productHistoryContract, "ManagerAdded").withArgs(addr2.address);
    });

    it("Should be able to see a product", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid, informationHash);

        const res = await productHistoryContract.connect(addr1).getProduct(uid);

        expect(res).to.be.an("array").that.has.lengthOf(3).and.contains(informationHash);
    });

    it("Shouldn't be able to see a product that doesn't exist", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        await addManager(addr1, productHistoryContract);

        const res = productHistoryContract.connect(addr1).getProduct(getRandomHash());

        await expect(res).to.be.revertedWith("Product does not exist");
    });

    it("Should be able to see a product history", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);
        await addManager(addr2, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid, informationHash);
        await productHistoryContract.connect(addr1).addManagerForProduct(uid, addr2.address);
        const infoHash1 = getRandomHash();
        const infoHash2 = getRandomHash();
        await productHistoryContract.connect(addr2).addOperation(uid, infoHash1);
        await productHistoryContract.connect(addr1).addOperation(uid, infoHash2);

        const res = await productHistoryContract.connect(addr1).getOperations(uid);

        expect(res).to.be.an("array").that.has.lengthOf(2);
        expect(res[0]).to.be.an("array").that.has.lengthOf(3).and.contains(infoHash1);
        expect(res[1]).to.be.an("array").that.has.lengthOf(3).and.contains(infoHash2);
    });

    it("Shouldn't be able to see a product history for a product that doesn't exist", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        await addManager(addr1, productHistoryContract);

        const res = productHistoryContract.connect(addr1).getOperations(getRandomHash());

        await expect(res).to.be.revertedWith("Product does not exist");
    });

    it("A manager should be able to see his products", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);
        await addManager(addr2, productHistoryContract);
        const uid1 = await productHistoryContract.connect(addr1).generateProductUID();
        const uid2 = await productHistoryContract.connect(addr2).generateProductUID();
        await productHistoryContract.connect(addr1).createProduct(uid1, informationHash);
        await productHistoryContract.connect(addr1).createProduct(uid2, informationHash);
        await productHistoryContract.connect(addr1).addManagerForProduct(uid1, addr2.address);

        const res = await productHistoryContract.connect(addr2).getProducts();

        expect(res).to.be.an("array").that.has.lengthOf(1).and.contains(uid1);
    });

    it("Only a manager should be able to see his products", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);

        const res = productHistoryContract.connect(addr2).getProducts();

        await expect(res).to.be.reverted;
    });
});