const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expectEvent } = require('@openzeppelin/test-helpers');

describe("Version contract", function () {
    async function deployVersionFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const Version = await ethers.getContractFactory("Version");
        versionContract = await Version.deploy();

        return { versionContract, owner, addr1, addr2 };
    }

    it("Initial version should be 0", async function () {
        const { versionContract } = await loadFixture(deployVersionFixture);

        expect(await versionContract.getVersion()).to.equal(0);
    });

    it("Version should be 1 after upgrade", async function () {
        const { versionContract, addr1 } = await loadFixture(deployVersionFixture);

        await versionContract.addManager(addr1.address);
        await versionContract.connect(addr1).updateVersion();

        expect(await versionContract.getVersion()).to.equal(1);
    });

    it("Managers should be able to upgrade", async function () {
        const { versionContract, addr1 } = await loadFixture(deployVersionFixture);

        await versionContract.addManager(addr1.address);
        await versionContract.connect(addr1).updateVersion();

        expect(await versionContract.getVersion()).to.equal(1);
    });

    it("Only managers should be able to upgrade", async function () {
        const { versionContract, addr1 } = await loadFixture(deployVersionFixture);

        await expect(versionContract.updateVersion()).to.be.reverted;
        await expect(versionContract.connect(addr1).updateVersion()).to.be.reverted;
    });

    it("Only owner should be able to add new owners", async function () {
        const { versionContract, addr1, addr2 } = await loadFixture(deployVersionFixture);

        await expect(versionContract.connect(addr1).addManager(addr2.address)).to.be.reverted;
    });
});