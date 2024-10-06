import {
  createPublicClient,
  createWalletClient,
  formatEther,
  getContract,
  http,
  parseEther,
} from "viem";
import { sepolia } from "viem/chains";
import { bankAbi } from "./abi";
import { mnemonicToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

// Load environment variables from the .env file
dotenv.config();

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});
const walletClient = createWalletClient({
  chain: sepolia,
  transport: http(),
});

const contractAddress = "0x6e7b75d9b5234b1e92ac7de06983e710390a64b3";
publicClient.watchContractEvent({
  address: contractAddress,
  abi: bankAbi,
  eventName: "Deposit",
  onLogs: (logs) => {
    const message = logs.map(({ eventName, args }) => {
      return `Event name: ${eventName} ${args.account} - ${formatEther(args.amount!)}`;
    });
    console.log(message);
  },
});

// Function to get gas price
async function getGasPrice(): Promise<void> {
  try {
    const gasPrice = await publicClient.getGasPrice();
    console.log("Current gas price:", gasPrice);
  } catch (error) {
    console.error("Error fetching gas price:", error);
  }
}

// Function to get balance of an Ethereum address
async function getBalance(address: `0x${string}`): Promise<void> {
  try {
    const balance = await publicClient.getBalance({ address });
    console.log(`Balance of address ${address}:`, balance / 1n ** 18n, "ETH"); // Balance in ETH
  } catch (error) {
    console.error("Error fetching balance:", error);
  }
}

// Function to send Ether using a mnemonic (seed phrase)
async function sendEtherFromSeed(
  seedPhrase: string,
  toAddress: `0x${string}`,
  amountInEther: string,
): Promise<void> {
  try {
    // Create an account from the seed phrase (mnemonic)
    const account = mnemonicToAccount(seedPhrase);

    // Convert Ether to Wei (as amounts are in Wei in Ethereum)
    const value = BigInt(Number(amountInEther) * 1e18);

    // Send transaction
    const txHash = await walletClient.sendTransaction({
      account,
      to: toAddress,
      value,
      gas: 21000n, // Standard gas limit for simple Ether transfer
    });

    console.log("Transaction sent:", txHash);
  } catch (error) {
    console.error("Error sending Ether:", error);
  }
}

// Function to interact with a smart contract
async function callDepositContractMethod(
  contractAddress: `0x${string}`,
  seedPhrase: string,
  amount: bigint,
): Promise<void> {
  try {
    const contract = getContract({
      address: contractAddress,
      abi: bankAbi,
      client: publicClient,
    });
    const account = mnemonicToAccount(seedPhrase);
    // @ts-ignore
    const result = await contract.write.deposit({
      value: amount,
      account: account,
    });

    console.log(`Result of calling deposit:`, result);
  } catch (error) {
    console.error(`Error calling contract method deposit:`, error);
  }
}

// Example usage
async function main(): Promise<void> {
  const address: `0x${string}` = process.env.ETHEREUM_ADDRESS as `0x${string}`; // Your Ethereum address
  const seedPhrase = process.env.SEED_PHRASE as string; // Your seed phrase (mnemonic)
  const recipientAddress: `0x${string}` = contractAddress; // Recipient's Ethereum address

  await getGasPrice(); // Fetch the current gas price
  await getBalance(address); // Fetch the balance of the address
  await sendEtherFromSeed(seedPhrase, recipientAddress, "0.0001"); // Send Ether using the seed phrase
  await callDepositContractMethod(
    contractAddress,
    seedPhrase,
    parseEther("0.00001"),
  );
}

// Run the main function
main().catch(console.error);
