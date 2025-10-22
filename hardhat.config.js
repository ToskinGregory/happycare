require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!BASE_SEPOLIA_RPC_URL || !PRIVATE_KEY) {
  console.error("Please set BASE_SEPOLIA_RPC_URL and PRIVATE_KEY in a .env file");
  process.exit(1);
}

module.exports = {
  solidity: "0.8.17",
  networks: {
    baseSepolia: {
      url: BASE_SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 84532
    }
  }
};
