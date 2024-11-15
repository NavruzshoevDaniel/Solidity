import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const WTCoinModule = buildModule("WTCoin", (m) => {
  const tCoinBridge = m.contract("WTCoin");
  return { tCoinBridge };
});

export default WTCoinModule;
