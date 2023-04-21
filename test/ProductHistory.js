const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("Product history productHistoryContract", function () {
    async function deployProductHistoryFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const ProductHistory = await ethers.getContractFactory("ProductHistory");
        productHistoryContract = await ProductHistory.deploy();

        return { productHistoryContract, owner, addr1, addr2 };
    }

    function getRandomHash() {
        return ethers.utils.formatBytes32String(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    }

    function getManagerRequest() {
        const informationHash = "0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231";
        return { informationHash };
    }

    async function addManager(address, productHistoryContract) {
        const { informationHash } = getManagerRequest();

        await productHistoryContract.connect(address).submitManagerRequest(informationHash);
        await productHistoryContract.approveManagerRequest(address.address);
    }

    function getProduct() {
        const informationHash = "0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231";
        const productOperations = [
            {
                informationHash: "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            },
            {
                informationHash: "0xca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
            }
        ];

        return {
            informationHash,
            productOperations
        };
    }

    it("Should be able to deploy productHistoryContract", async function () {
        const { productHistoryContract } = await loadFixture(deployProductHistoryFixture);

        expect(productHistoryContract.address).to.properAddress;
    });

    it("Only manager should be able to generate product uid", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);

        const res = productHistoryContract.connect(addr1).generateProductUID();

        await expect(res).to.be.reverted;
    });

    it("User that is not manager should not be able to add new products", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        const parentInformationHash = getRandomHash();
        await addManager(addr1, productHistoryContract);
        const parentUID = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(parentUID, parentInformationHash, []);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();

        const res = productHistoryContract.addProduct(uid, informationHash, [parentUID]);

        await expect(res).to.be.reverted;
    });

    it("Manager should be able to see his products", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        const parentInformationHash = getRandomHash();
        await addManager(addr1, productHistoryContract);
        await addManager(addr2, productHistoryContract);
        const parentUID = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(parentUID, parentInformationHash, []);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(uid, informationHash, [parentUID]);
        const otherInformationHash = getRandomHash();
        const otherUID = await productHistoryContract.connect(addr2).generateProductUID();
        await productHistoryContract.connect(addr2).addProduct(otherUID, otherInformationHash, []);

        const products = await productHistoryContract.connect(addr1).getManagerProducts();

        expect(products).to.have.lengthOf(2);
        expect(products[0]).to.equal(parentUID);
        expect(products[1]).to.equal(uid);
    });

    it("Manager should be able to transfer ownership of his products", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        const parentInformationHash = getRandomHash();
        await addManager(addr1, productHistoryContract);
        const parentUID = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(parentUID, parentInformationHash, []);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(uid, informationHash, [parentUID]);
        await productHistoryContract.connect(addr1).transferProductOwnership(uid, addr2.address);

        const products = await productHistoryContract.connect(addr2).getManagerProducts();

        expect(products).to.have.lengthOf(1);
        expect(products[0]).to.equal(uid);
    });

    it("Manager should not be able to transfer ownership of other manager's products", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        const parentInformationHash = getRandomHash();
        await addManager(addr1, productHistoryContract);
        const parentUID = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(parentUID, parentInformationHash, []);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(uid, informationHash, [parentUID]);
        await addManager(addr2, productHistoryContract);
        const otherUID = await productHistoryContract.connect(addr2).generateProductUID();
        await productHistoryContract.connect(addr2).addProduct(otherUID, informationHash, []);

        const res = productHistoryContract.connect(addr2).transferProductOwnership(uid, addr2.address);

        await expect(res).to.be.revertedWith("User is not manager of this product");
    });

    it("Manager should not be able to transfer ownership of non-existing product", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        await addManager(addr1, productHistoryContract);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();

        const res = productHistoryContract.connect(addr1).transferProductOwnership(uid, addr1.address);

        await expect(res).to.be.revertedWith("Product with this uid does not exist");
    });

    it("Only manager should be able to transfer ownership of product", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        const parentInformationHash = getRandomHash();
        await addManager(addr1, productHistoryContract);
        const parentUID = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(parentUID, parentInformationHash, []);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(uid, informationHash, [parentUID]);

        const res = productHistoryContract.connect(addr2).transferProductOwnership(uid, addr1.address);

        await expect(res).to.be.reverted;
    });

    it("User that is not manager should not be able to update products", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        const parentInformationHash = getRandomHash();
        await addManager(addr1, productHistoryContract);
        const parentUID = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(parentUID, parentInformationHash, []);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(uid, informationHash, [parentUID]);

        const res = productHistoryContract.updateProduct(uid, informationHash);

        await expect(res).to.be.reverted;
    });

    it("Manager should not be able to update product with non-existing uid", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        const parentInformationHash = getRandomHash();
        await addManager(addr1, productHistoryContract);
        const parentUID = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(parentUID, parentInformationHash, []);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();

        const res = productHistoryContract.connect(addr1).updateProduct(uid, getRandomHash());

        await expect(res).to.be.revertedWith("Product with this uid does not exist");
    });

    it("User that is manager should be able to update products", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash, productOperations } = getProduct();
        const parentInformationHash = getRandomHash();
        await addManager(addr1, productHistoryContract);
        const parentUID = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(parentUID, parentInformationHash, []);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(uid, informationHash, [parentUID]);
        const op1 = productOperations[0];
        const op2 = productOperations[1];
        await productHistoryContract.connect(addr1).updateProduct(uid, op1.informationHash);
        await productHistoryContract.connect(addr1).updateProduct(uid, op2.informationHash);

        const [retInformationHash, retParentUIDS, retProductOperations] = await productHistoryContract.getProduct(uid);

        expect(retInformationHash).to.equal(informationHash);
        expect(retParentUIDS).to.deep.equal([parentUID]);
        for (let i = 0; i < retProductOperations.length; i++) {
            expect(retProductOperations[i].informationHash).to.equal(productOperations[i].informationHash);
        }
    });

    it("User that is not manager of a product should not be able to update the product", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash, productOperations } = getProduct();
        const parentInformationHash = getRandomHash();
        await addManager(addr1, productHistoryContract);
        await addManager(addr2, productHistoryContract);
        const parentUID = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(parentUID, parentInformationHash, []);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(uid, informationHash, [parentUID]);
        const op1 = productOperations[0];
        const op2 = productOperations[1];
        await productHistoryContract.connect(addr1).updateProduct(uid, op1.informationHash);

        const res = productHistoryContract.connect(addr2).updateProduct(uid, op2.informationHash);

        await expect(res).to.be.revertedWith("User is not manager of this product");
    });

    it("Manager should not be able to create product with existing uid", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        const parentInformationHash = getRandomHash();
        await addManager(addr1, productHistoryContract);
        const parentUID = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(parentUID, parentInformationHash, []);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(uid, informationHash, [parentUID]);

        const res = productHistoryContract.connect(addr1).addProduct(uid, informationHash, [parentUID]);

        await expect(res).to.be.revertedWith("Product with this uid already exists");
    });

    it("Manager should not be able to create product with parent uid that does not exist", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getProduct();
        const parentInformationHash = getRandomHash();
        await addManager(addr1, productHistoryContract);
        const parentUID = await productHistoryContract.connect(addr1).generateProductUID();
        await productHistoryContract.connect(addr1).addProduct(parentUID, parentInformationHash, []);
        const uid = await productHistoryContract.connect(addr1).generateProductUID();

        const res = productHistoryContract.connect(addr1).addProduct(uid, informationHash, [parentUID, getRandomHash()]);

        await expect(res).to.be.revertedWith("Parent product with this uid does not exist");
    });

    it("Users should not be able to submit manager requests more than once", async function () {
        const { productHistoryContract } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getManagerRequest();

        await productHistoryContract.submitManagerRequest(informationHash);
        const res = productHistoryContract.submitManagerRequest(informationHash);

        await expect(res).to.be.revertedWith("Manager request already submitted");
    });

    it("Only admin should be able to approve manager requests", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);

        const res = productHistoryContract.connect(addr1).approveManagerRequest(addr2.address);

        await expect(res).to.be.reverted;
    });

    it("Admin should not be able to approve manager request that does not exist", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);

        const res = productHistoryContract.approveManagerRequest(addr1.address);

        await expect(res).to.be.revertedWith("Manager request does not exist");
    });

    it("Admin should not be able to deny manager request that does not exist", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);

        const res = productHistoryContract.denyManagerRequest(addr1.address);

        await expect(res).to.be.revertedWith("Manager request does not exist");
    });

    it("Admin should be able to approve manager request", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(informationHash);
        await productHistoryContract.approveManagerRequest(addr1.address);

        const res = await productHistoryContract.hasRole(productHistoryContract.MANAGER_ROLE(), addr1.address);

        expect(res).to.be.true;
    });

    it("Admin should be able to deny manager request", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(informationHash);
        await productHistoryContract.denyManagerRequest(addr1.address);

        const res = await productHistoryContract.hasRole(productHistoryContract.MANAGER_ROLE(), addr1.address);

        expect(res).to.be.false;
    });

    it("Admin should not be able to approve manager request from a user that is already a manager", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(informationHash);
        await productHistoryContract.approveManagerRequest(addr1.address);

        const res = productHistoryContract.approveManagerRequest(addr1.address);

        await expect(res).to.be.revertedWith("Account is already a manager");
    });

    it("Admin should be able to see a user's manager request", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(informationHash);

        const res = await productHistoryContract.getManagerRequest(addr1.address);

        expect(res[0]).to.equal(addr1.address);
        expect(res[1]).to.equal(informationHash);
    });

    it("Admin should be able to see unapproved manager requests", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(informationHash);
        await productHistoryContract.connect(addr2).submitManagerRequest(informationHash);
        await productHistoryContract.approveManagerRequest(addr1.address);

        const res = await productHistoryContract.getManagerRequestAddresses();

        expect(res.length).to.equal(1);
        expect(res[0]).to.equal(addr2.address);
    });

    it("Admin should be able to see approved manager requests", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(informationHash);
        await productHistoryContract.connect(addr2).submitManagerRequest(informationHash);
        await productHistoryContract.approveManagerRequest(addr1.address);

        const res = await productHistoryContract.getApprovedManagerRequestsAddresses();

        expect(res.length).to.equal(1);
        expect(res[0]).to.equal(addr1.address);
    });

    it("Admin should only see unapproved manager requests that have not been denied", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { informationHash } = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(informationHash);
        await productHistoryContract.connect(addr2).submitManagerRequest(informationHash);
        await productHistoryContract.denyManagerRequest(addr2.address);

        const res = await productHistoryContract.getManagerRequestAddresses();

        expect(res.length).to.equal(1);
        expect(res[0]).to.equal(addr1.address);
    });

    it("Admin should not be able to deny a manager request he already approved", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        await addManager(addr1, productHistoryContract);

        const res = productHistoryContract.denyManagerRequest(addr1.address);

        await expect(res).to.be.revertedWith("Manager request already approved");
    });

    it("Only admin should be able to see all manager requests", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);

        const res = productHistoryContract.connect(addr1).getManagerRequestAddresses();

        await expect(res).to.be.reverted;
    });

    it("Only admin should be able to see all approved manager requests", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);

        const res = productHistoryContract.connect(addr1).getApprovedManagerRequestsAddresses();

        await expect(res).to.be.reverted;
    });


    it("Only admin should be able to see a user's manager request", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);

        const res = productHistoryContract.connect(addr1).getManagerRequest(addr1.address);

        await expect(res).to.be.reverted;
    });

    it("Only admin should be able to approve manager request", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);

        const res = productHistoryContract.connect(addr1).approveManagerRequest(addr1.address);

        await expect(res).to.be.reverted;
    });

    it("Only admin should be able to deny manager request", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);

        const res = productHistoryContract.connect(addr1).denyManagerRequest(addr1.address);

        await expect(res).to.be.reverted;
    });
});