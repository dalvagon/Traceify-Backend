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

// 0xb9ce4cd41a4cED05992E5f42bbf2c7D05ed4C33d


// myth analyze ./contracts/ProductHistory.sol --solc-json solc.json
