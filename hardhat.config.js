require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.18",
  networks: {
    sepolia: {
      url: process.env.INFURA_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  coverage: {
    solc: {
      version: "0.8.18",
    }
  }
};

// npx hardhat run .\scripts\deploy.js --network sepolia

// 0x1f766dE1f3a01cc91B371E4b50ecC942DC0392E9