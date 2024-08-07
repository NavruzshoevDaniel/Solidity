import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TGameModule = buildModule("TGameModule", (m) => {
  const tGame = m.contract("TGame");

  return { tGame };
});

export default TGameModule;
