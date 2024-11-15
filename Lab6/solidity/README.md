# Simple Bridge: Test BNB ↔ Polygon zkEVM

This is a simple bridge between the **Test BNB** and **Polygon zkEVM** networks, implemented using a lock-mint strategy.

The bridge allows transferring **TCoin** tokens from the **Test BNB** network to wrapped **WTCoin** tokens on the **Polygon zkEVM** network, and vice versa. The bridging process is facilitated by a designated bridge wallet.

## How It Works

1. **Transferring TCoin from Test BNB to Polygon zkEVM**:
    - Users send TCoin to a specific bridge address on the **Test BNB** network.
    - The backend listens for the `transfer` event on-chain.
    - Once the event is detected, the backend mints the corresponding amount of **WTCoin** tokens in the **Polygon zkEVM** network.

2. **Transferring WTCoin from Polygon zkEVM to Test BNB**:
    - Users send WTCoin to the bridge address on the **Polygon zkEVM** network.
    - The bridge burns the WTCoin tokens.
    - After the burn event is detected, the corresponding amount of **TCoin** tokens is transferred back to the user's wallet in the **Test BNB** network.

## Contract Addresses

### Test BNB
- **Deployed Contracts**: `Lab6/solidity/ignition/deployments/chain-97/deployed_addresses.json`
- **TCoin Contract**: `0xbF4Ec32b668A63c17077B1F67d8708F6B065a5E6`

### Polygon zkEVM
- **Deployed Contracts**: `Lab6/solidity/ignition/deployments/chain-2442/deployed_addresses.json`
- **WTCoin Contract**: `0xbF4Ec32b668A63c17077B1F67d8708F6B065a5E6`

## Backend
The backend logic for handling the bridge transactions is implemented in: `Lab6/backend/main.ts`.

## Deployment Scripts
The deployment scripts for the contracts are defined in `Lab6/solidity/package.json`:

```json
"scripts": {
  "compile": "hardhat compile",
  "test": "hardhat test",
  "deploy-sepolia-testnet": "npx hardhat ignition deploy ignition/modules/TCoin.ts --network eth_sepolia --verify",
  "deploy-bsc-testnet": "npx hardhat ignition deploy ignition/modules/TCoin.ts --network bsc_testnet --verify",
  "deploy-bsc-testnet-wtcoin": "npx hardhat ignition deploy ignition/modules/WTCoin.ts --network bsc_testnet --verify",
  "deploy-zkEVM-testnet": "npx hardhat ignition deploy ignition/modules/TCoin.ts --network polygonZkEVMTestnet --verify"
}
```

These scripts are used to compile, test, and deploy the TCoin and WTCoin contracts across various test networks, including Sepolia, BSC Testnet, and Polygon zkEVM Testnet.

## Notes
This bridge is designed for test purposes and currently operates on the **Test BNB** and **Polygon zkEVM** networks.