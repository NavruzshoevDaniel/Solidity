import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TCoinModule = buildModule("TCoin", (m) => {
  const randomizerOracle = m.contract("TCoin");
  return { randomizerOracle };
});

export default TCoinModule;
