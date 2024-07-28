import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const TMoneyModule = buildModule("TMoneyModule", (m) => {

  const tMoney = m.contract("TMoney", ["51995716056975351"]);

  return { tMoney };
});

export default TMoneyModule;
