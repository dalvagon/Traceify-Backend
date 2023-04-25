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

// 0x6A3cF1Ba1B8B44fd0715aa930de0058dE0198862


// myth analyze ./contracts/ProductHistory.sol --solc-json solc.json
