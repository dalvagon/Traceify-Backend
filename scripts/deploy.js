const deploy = async () => {
    const [deployer] = await hre.ethers.getSigners();
    const accountBalance = await deployer.getBalance();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", accountBalance.toString());

    const contractFactory = await hre.ethers.getContractFactory("Version");
    const contract = await contractFactory.deploy();
    await contract.deployed();

    console.log("Contract deployed to:", contract.address);
};

const main = async () => {
    try {
        await deploy();
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

main();
