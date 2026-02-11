/**
 * Deploy CipherAchievements contract to Base Sepolia
 * Usage: PRIVATE_KEY=0x... npx tsx scripts/deploy-achievements.js
 */
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import solc from "solc";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const privateKey = process.env.PRIVATE_KEY;
const gameContractAddress = process.env.GAME_CONTRACT || "0x7ac03999c30112cbbe03130af1eb7807246c0a5c";

if (!privateKey) {
  console.error("Usage: PRIVATE_KEY=0x... npx tsx scripts/deploy-achievements.js");
  process.exit(1);
}

// Read the contract source
const contractPath = path.join(__dirname, "../contracts/src/CipherAchievements.sol");
const source = fs.readFileSync(contractPath, "utf8");

// Compile the contract
const input = {
  language: "Solidity",
  sources: {
    "CipherAchievements.sol": {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};

console.log("Compiling CipherAchievements...");
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  for (const error of output.errors) {
    if (error.severity === "error") {
      console.error("Compilation error:", error.formattedMessage);
      process.exit(1);
    } else {
      console.warn("Warning:", error.formattedMessage);
    }
  }
}

const contract = output.contracts["CipherAchievements.sol"]["CipherAchievements"];
const abi = contract.abi;
const bytecode = "0x" + contract.evm.bytecode.object;

console.log("Contract compiled successfully!");

// Deploy
const account = privateKeyToAccount(privateKey);
console.log("Deploying from:", account.address);

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});

async function main() {
  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Balance:", Number(balance) / 1e18, "ETH");

  if (balance === 0n) {
    console.error("No ETH balance!");
    process.exit(1);
  }

  console.log("Deploying CipherAchievements...");

  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args: [],
  });

  console.log("Transaction hash:", hash);
  console.log("Waiting for confirmation...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log("\n=================================");
  console.log("CipherAchievements deployed!");
  console.log("Contract address:", receipt.contractAddress);
  console.log("=================================\n");

  // Set game contract
  console.log("Setting game contract to:", gameContractAddress);
  
  const setGameHash = await walletClient.writeContract({
    address: receipt.contractAddress,
    abi,
    functionName: "setGameContract",
    args: [gameContractAddress],
  });

  await publicClient.waitForTransactionReceipt({ hash: setGameHash });
  console.log("Game contract set!");

  console.log("\nAdd to .env:");
  console.log(`NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS=${receipt.contractAddress}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
