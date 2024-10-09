export const networkConfig = {
  default: {
    name: "hardhat",
  },
  11155111: {
    name: "sepolia",
    PoolAddressesProvider: "0x0496275d34753A48320CA58103d5220d394FF77F",
    daiAddress: "0x68194a729C2450ad26072b3D33ADaCbcef39D574",
    usdcAddress: "0xda9d4f9b69ac6C22e444eD9aF0CfC043b7a7f53f",
  },
  1: {
    name: "mainnet",
    PoolAddressesProvider: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
    daiAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    usdcAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  },
};
