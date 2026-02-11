/**
 * Deploy CipherBadges contract to Base Sepolia using solc + viem
 * Usage: PRIVATE_KEY=0x... npx tsx scripts/deploy-badges.js
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

if (!privateKey) {
  console.error("Usage: PRIVATE_KEY=0x... npx tsx scripts/deploy-badges.js");
  process.exit(1);
}

// Read file helper with import resolution
function findImport(importPath) {
  const paths = [
    path.join(__dirname, "../node_modules", importPath),
    path.join(__dirname, "../contracts/src", importPath),
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      return { contents: fs.readFileSync(p, "utf8") };
    }
  }

  return { error: `File not found: ${importPath}` };
}

// Read the contract source
const contractPath = path.join(__dirname, "../contracts/src/CipherBadges.sol");
const source = fs.readFileSync(contractPath, "utf8");

// Compile the contract
const input = {
  language: "Solidity",
  sources: {
    "CipherBadges.sol": {
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

console.log("Compiling CipherBadges contract...");
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));

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

const contract = output.contracts["CipherBadges.sol"]["CipherBadges"];
if (!contract) {
  console.error("Contract not found in output");
  console.error("Available contracts:", Object.keys(output.contracts || {}));
  process.exit(1);
}

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
    console.error("No ETH balance! Get testnet ETH from https://www.alchemy.com/faucets/base-sepolia");
    process.exit(1);
  }

  // Base URI for badge metadata
  const baseURI = "https://dragongear-game.vercel.app/badges/";

  console.log("Deploying CipherBadges contract...");
  console.log("Base URI:", baseURI);

  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args: [baseURI],
  });

  console.log("Transaction hash:", hash);
  console.log("Waiting for confirmation...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log("\n=================================");
  console.log("CipherBadges deployed successfully!");
  console.log("Contract address:", receipt.contractAddress);
  console.log("=================================\n");
  console.log("Add this to your .env file:");
  console.log(`NEXT_PUBLIC_BADGES_CONTRACT=${receipt.contractAddress}`);

  // Save ABI for frontend
  const abiPath = path.join(__dirname, "../src/lib/badges-abi.json");
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
  console.log("\nABI saved to:", abiPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
