const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("Product history contract", function () {
    async function deployProductHistoryFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const ProductHistory = await ethers.getContractFactory("ProductHistory");
        productHistoryContract = await ProductHistory.deploy();

        return { productHistoryContract, owner, addr1, addr2 };
    }

    function getRandomDate() {
        const start = new Date('2020-01-01');
        const end = new Date('2022-12-31');
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    function getManagerRequest() {
        const informationHash = "0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231";

        return { informationHash };
    }

    async function addManager(address, contract) {
        const { informationHash } = getManagerRequest();

        await contract.connect(address).submitManagerRequest(informationHash);
        await contract.approveManagerRequest(address.address);
    }

    function getProduct() {
        const bardcode = ethers.utils.formatBytes32String("123456789");
        const informationHash = "0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231";
        const parentBarcodes = [ethers.utils.formatBytes32String("987654321"), ethers.utils.formatBytes32String("918273645")];
        const productOperations = [
            {
                informationHash: "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                timestamp: getRandomDate().getTime()
            },
            {
                informationHash: "0xca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
                timestamp: getRandomDate().getTime()
            }
        ];

        return {
            bardcode,
            informationHash,
            parentBarcodes,
            productOperations
        };
    }

    it("User that is not manager should not be able to add new products", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { bardcode, informationHash } = getProduct();

        const res = productHistoryContract.addProduct(bardcode, informationHash, []);

        await expect(res).to.be.reverted;
    });

    it("Manager should not be able to create product with existing barcode", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { bardcode, informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);
        await productHistoryContract.connect(addr1).addProduct(bardcode, informationHash, []);

        const res = productHistoryContract.connect(addr1).addProduct(bardcode, informationHash, []);

        await expect(res).to.be.revertedWith("Product with this barcode already exists");
    });

    it("User that is not manager should not be able to update products", async function () {
        const { productHistoryContract } = await loadFixture(deployProductHistoryFixture);
        const { bardcode, informationHash } = getProduct();

        const res = productHistoryContract.updateProduct(bardcode, informationHash, getRandomDate().getTime());

        await expect(res).to.be.reverted;
    });

    it("Manager should not be able to update product with non-existing barcode", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { bardcode, informationHash } = getProduct();
        await addManager(addr1, productHistoryContract);

        const res = productHistoryContract.connect(addr1).updateProduct(bardcode, informationHash, getRandomDate().getTime());

        await expect(res).to.be.revertedWith("Product with this barcode does not exist");
    });

    it("User that is manager should be able to update products", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { bardcode, informationHash, productOperations } = getProduct();
        const op1 = productOperations[0];
        const op2 = productOperations[1];
        await addManager(addr1, productHistoryContract);
        await productHistoryContract.connect(addr1).addProduct(bardcode, informationHash, []);
        await productHistoryContract.connect(addr1).updateProduct(bardcode, op1.informationHash, op1.timestamp);
        await productHistoryContract.connect(addr1).updateProduct(bardcode, op2.informationHash, op2.timestamp);

        const [retInformationHash, retParentBarcodes, retProductOperations] = await productHistoryContract.getProduct(bardcode);

        expect(retInformationHash).to.equal(informationHash);
        expect(retParentBarcodes).to.deep.equal([]);
        for (let i = 0; i < retProductOperations.length; i++) {
            expect(retProductOperations[i].informationHash).to.equal(productOperations[i].informationHash);
            expect(retProductOperations[i].timestamp).to.equal(productOperations[i].timestamp);
        }
    });

    it("User that is not manager of a product should not be able to update the product", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);
        const { bardcode, informationHash, productOperations } = getProduct();
        const op1 = productOperations[0];
        const op2 = productOperations[1];
        await addManager(addr1, productHistoryContract);
        await addManager(addr2, productHistoryContract);
        await productHistoryContract.connect(addr1).addProduct(bardcode, informationHash, []);
        await productHistoryContract.connect(addr1).updateProduct(bardcode, op1.informationHash, op1.timestamp);

        const res = productHistoryContract.connect(addr2).updateProduct(bardcode, op2.informationHash, op2.timestamp);

        await expect(res).to.be.revertedWith("User is not manager of this product");
    });

    it("Manager should not be able to create product with parent barcode that does not exist", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { bardcode, informationHash, parentBarcodes } = getProduct();
        await addManager(addr1, productHistoryContract);

        const res = productHistoryContract.connect(addr1).addProduct(bardcode, informationHash, parentBarcodes);

        await expect(res).to.be.revertedWith("Parent product with this barcode does not exist");
    });

    it("Users should not be able to submit manager requests more than once", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
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
        const { informationHash } = getManagerRequest();
        await productHistoryContract.connect(addr1).submitManagerRequest(informationHash);
        await productHistoryContract.approveManagerRequest(addr1.address);

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