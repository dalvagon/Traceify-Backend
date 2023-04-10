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

// 0x7B52881Bdf50c4CDaFb911bb36d2a5930718BF32