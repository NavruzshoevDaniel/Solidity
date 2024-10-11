import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RandomizerOracleModule = buildModule("RandomizerOracleModule", (m) => {
  const randomizerOracle = m.contract("RandomizerOracle", [
    "59173207514159804696005407707596728814739758187227151529206208271142199346381",
    "0x9ddfaca8183c41ad55329bdeed9f6a8d53168b1b",
  ]);
  return { randomizerOracle };
});

export default RandomizerOracleModule;
