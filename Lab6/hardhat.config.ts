import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

// Load environment variables from the .env file
dotenv.config();

const ALCHEMY_API_KEY_MAINNET = process.env.ALCHEMY_API_KEY_MAINNET;
const ALCHEMY_API_KEY_SEPOLIA = process.env.ALCHEMY_API_KEY_SEPOLIA;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;
const TESTNET_MNEMONIC = process.env.TESTNET_MNEMONIC;

const accounts = {
  mnemonic:
    TESTNET_MNEMONIC ||
    "velvet deliver grief train result fortune travel voice over subject subject staff nominee bone name",
  path: "m/44'/60'/0'/0",
  initialIndex: 0,
  count: 20,
  accountsBalance: TESTNET_MNEMONIC ? undefined : "100000000000000000000000000",
};

const config: HardhatUserConfig = {
  networks: {
    local: {
      url: "http://localhost:8545",
    },
    hardhat: {
      allowUnlimitedContractSize: true,
      forking: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY_MAINNET}`,
        blockNumber: 20901927,
      },
      chainId: 31337,
    },
    bsc_testnet: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545`,
      accounts,
      chainId: 97,
    },
    polygonZkEVMTestnet: {
      url: `https://rpc.cardona.zkevm-rpc.com`,
      accounts: accounts,
      chainId: 2442,
    },
    eth_mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY_MAINNET}`,
      accounts,
      chainId: 1,
    },
    eth_sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY_SEPOLIA}`,
      accounts,
      chainId: 11155111,
    },
  },
  etherscan: {
    customChains: [
      {
        network: "polygonZkEVMTestnet",
        chainId: 2442,
        urls: {
          apiURL: "https://api-cardona-zkevm.polygonscan.com/api",
          browserURL: "https://cardona-zkevm.polygonscan.com",
        },
      },
    ],
    apiKey: {
      eth_mainnet: ETHERSCAN_API_KEY,
      eth_sepolia: ETHERSCAN_API_KEY,
      bscTestnet: BSCSCAN_API_KEY,
      polygonZkEVMTestnet: POLYGONSCAN_API_KEY,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.27",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 100000,
          },
          evmVersion: "cancun",
        },
      },
    ],
  },
  gasReporter: {
    enabled: true,
  },
  mocha: {
    timeout: 500000, // 500 seconds max for running tests
  },
};

export default config;
