const run = async () => {
    const [owner, randomPerson1, randomPerson2] = await hre.ethers.getSigners();
    const versionContractFactory = await hre.ethers.getContractFactory("Version");
    const versionContract = await versionContractFactory.deploy();
    await versionContract.deployed();
    console.log("Contract deployed to:", versionContract.address);
    console.log("Contract deployed by:", owner.address);

    let txn;
    txn = await versionContract.getVersion();
    console.log("Version:  " + txn);

    txn = await versionContract.addOwner(randomPerson1.address);
    await txn.wait();

    txn = await versionContract.connect(randomPerson1).addOwner(owner.address);
    await txn.wait();

    txn = await versionContract.connect(randomPerson1).updateVersion();
    await txn.wait();

    txn = await versionContract.getVersion();
    console.log("Version:  " + txn);

    txn = await versionContract.connect(randomPerson2).updateVersion();
    await txn.wait();
};

const main = async () => {
    try {
        await run();
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

main();