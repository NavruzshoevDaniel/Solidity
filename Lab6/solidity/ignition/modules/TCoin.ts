import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TCoinModule = buildModule("TCoin", (m) => {
  const tCoin = m.contract("TCoin");
  return { tCoin };
});

export default TCoinModule;
