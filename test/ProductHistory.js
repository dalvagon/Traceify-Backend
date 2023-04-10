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

    it("Only owner should be able to add new managers", async function () {
        const { productHistoryContract, addr1, addr2 } = await loadFixture(deployProductHistoryFixture);

        await expect(productHistoryContract.connect(addr1).addManager(addr2.address)).to.be.reverted;
    });

    it("User that is not manager should not be able to add new products", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { bardcode, informationHash } = getProduct();

        const res = productHistoryContract.addProduct(bardcode, informationHash, []);

        await expect(res).to.be.reverted;
    });

    it("Manager should not be able to create product with existing barcode", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { bardcode, informationHash } = getProduct();

        await productHistoryContract.addManager(addr1.address);
        await productHistoryContract.connect(addr1).addProduct(bardcode, informationHash, []);
        const res = productHistoryContract.connect(addr1).addProduct(bardcode, informationHash, []);

        await expect(res).to.be.revertedWith("Product with this barcode already exists");
    });

    it("User that is not manager should not be able to update products", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { bardcode, informationHash } = getProduct();

        const res = productHistoryContract.updateProduct(bardcode, informationHash, getRandomDate().getTime());

        await expect(res).to.be.reverted;
    });

    it("Manager should not be able to update product with non-existing barcode", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { bardcode, informationHash } = getProduct();

        await productHistoryContract.addManager(addr1.address);
        const res = productHistoryContract.connect(addr1).updateProduct(bardcode, informationHash, getRandomDate().getTime());

        await expect(res).to.be.revertedWith("Product with this barcode does not exist");
    });

    it("User that is manager should be able to update products", async function () {
        const { productHistoryContract, addr1 } = await loadFixture(deployProductHistoryFixture);
        const { bardcode, informationHash, productOperations } = getProduct();
        const op1 = productOperations[0];
        const op2 = productOperations[1];

        await productHistoryContract.addManager(addr1.address);
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

        await productHistoryContract.addManager(addr1.address);
        await productHistoryContract.addManager(addr2.address);
        await productHistoryContract.connect(addr1).addProduct(bardcode, informationHash, []);
        await productHistoryContract.connect(addr1).updateProduct(bardcode, op1.informationHash, op1.timestamp);
        const res = productHistoryContract.connect(addr2).updateProduct(bardcode, op2.informationHash, op2.timestamp);

        await expect(res).to.be.revertedWith("User is not manager of this product");
    });
});
