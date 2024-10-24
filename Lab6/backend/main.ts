import {
  createPublicClient,
  createWalletClient,
  formatEther,
  getContract,
  http,
} from "viem";
import { bscTestnet, sepolia } from "viem/chains";
import { tCoinAbi } from "./abi/tCoinAbi";
import * as dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { wTCoinAbi } from "./abi/wTCoinAbi"; // Load environment variables from the .env file
// Load environment variables from the .env file
dotenv.config();

const BRIDGE_ADDRESS_PRIVATE_KEY = process.env
  .BRIDGE_ADDRESS_PRIVATE_KEY! as `0x{string}`;
const BRIDGE_ADDRESS_PUBLIC_KEY = process.env
  .BRIDGE_ADDRESS_PUBLIC_KEY! as `0x{string}`;

const sepoliaPublicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

const bscPublicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(),
});

const sepoliaWalletClient = createWalletClient({
  chain: sepolia,
  transport: http(),
  account: privateKeyToAccount(BRIDGE_ADDRESS_PRIVATE_KEY),
});

const bscWalletClient = createWalletClient({
  chain: bscTestnet,
  transport: http("https://data-seed-prebsc-1-s3.binance.org:8545/"),
  account: privateKeyToAccount(BRIDGE_ADDRESS_PRIVATE_KEY),
});
const tcoinSepoliaContractAddress =
  "0xDE35CF22646DbDd100B13957ba4C75D2f8F00335";
const tcoinSepoliaContract = getContract({
  address: tcoinSepoliaContractAddress,
  abi: tCoinAbi,
  client: sepoliaWalletClient,
});
const wTcoinContractAddress = "0x0908e34Af1EecD9BBd1786329e1BC6f9d3107EBc";

const wTCoinBscTestContract = getContract({
  address: wTcoinContractAddress,
  abi: wTCoinAbi,
  client: bscWalletClient,
});

// Function to handle Transfer events from the TCoinSepolia contract and mint to the WTCoinBscTest contract
async function handleTCoinSepoliaEvents(args: {
  from?: `0x${string}` | undefined;
  to?: `0x${string}` | undefined;
  value?: bigint | undefined;
}): Promise<void> {
  console.log(
    `Event Transfer: ${args.from} -> ${args.to} - ${formatEther(args.value!)}`,
  );
  if (args.to === BRIDGE_ADDRESS_PUBLIC_KEY) {
    const mintHash = await wTCoinBscTestContract.write.mint([
      args.from!,
      args.value!,
    ]);
    console.log(
      "Bridge minting to BSC: to=",
      args.from,
      "value=",
      args.value,
      "txHash=",
      mintHash,
    );
  }
}

// Function to handle Transfer events from the WTCoinBscTest contract and burn from the WTCoinBscTest contract and transfer to the TCoinSepolia contract
async function handleWTcoinBscTestEvents(args: {
  from?: `0x${string}` | undefined;
  to?: `0x${string}` | undefined;
  value?: bigint | undefined;
}): Promise<void> {
  console.log(
    `Event Transfer: ${args.from} -> ${args.to} - ${formatEther(args.value!)}`,
  );
  if (args.to === BRIDGE_ADDRESS_PUBLIC_KEY) {
    const burnHash = await wTCoinBscTestContract.write.burn([args.value!]);
    console.log(
      "Bridge burning from BSC: from=",
      args.from,
      "value=",
      args.value,
      "txHash=",
      burnHash,
    );
    const transferHash = await tcoinSepoliaContract.write.transfer([
      args.from!,
      args.value!,
    ]);
    console.log(
      "Bridge transfer to Sepolia: to=",
      args.from,
      "value=",
      args.value,
      "txHash=",
      transferHash,
    );
  }
}

async function main(): Promise<void> {
  sepoliaPublicClient.watchContractEvent({
    address: tcoinSepoliaContractAddress,
    abi: tCoinAbi,
    eventName: "Transfer",
    onLogs: (logs) => {
      logs.map(({ args }) => {
        handleTCoinSepoliaEvents(args);
      });
    },
  });

  bscPublicClient.watchContractEvent({
    address: wTcoinContractAddress,
    abi: wTCoinAbi,
    eventName: "Transfer",
    onLogs: (logs) => {
      logs.map(({ args }) => {
        handleWTcoinBscTestEvents(args);
      });
    },
  });
  console.log("Watching for events...");
}

// Run the main function
main().catch(console.error);
