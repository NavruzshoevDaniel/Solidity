import { mainnet, sepolia } from "wagmi/chains";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { createWeb3Modal } from "@web3modal/wagmi/react";

const projectId = "2ba3da035bcecba92f4ca7f0125af790";

const metadata = {
  name: "FirstProject",
  description: "AppKit Example",
  url: "https://web3modal.com", // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

const chains = [mainnet, sepolia] as const;
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false, // Optional - defaults to your Cloud configuration
  enableOnramp: true, // Optional - false as default
});
