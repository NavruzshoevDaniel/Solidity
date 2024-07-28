import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const TnftModule = buildModule("TnftModule", (m) => {

  const tNft = m.contract("Tnft");

  return { tNft };
});

export default TnftModule;
