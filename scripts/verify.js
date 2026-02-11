/**
 * Verify CipherTrail contract on BaseScan (Base Sepolia)
 * Usage: BASESCAN_API_KEY=... npx tsx scripts/verify.js
 */
import solc from "solc";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contractAddress = process.env.CONTRACT_ADDRESS || "0x7ac03999c30112cbbe03130af1eb7807246c0a5c";
const apiKey = process.env.BASESCAN_API_KEY;

if (!apiKey) {
  console.error("Usage: BASESCAN_API_KEY=... npx tsx scripts/verify.js");
  console.log("\nGet your API key from: https://basescan.org/myapikey");
  process.exit(1);
}

// Read the contract source
const contractPath = path.join(__dirname, "../contracts/src/CipherTrail.sol");
const source = fs.readFileSync(contractPath, "utf8");

// Compile to get the exact bytecode and metadata
const input = {
  language: "Solidity",
  sources: {
    "CipherTrail.sol": {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "metadata"],
      },
    },
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};

console.log("Compiling contract for verification...");
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  for (const error of output.errors) {
    if (error.severity === "error") {
      console.error("Compilation error:", error.formattedMessage);
      process.exit(1);
    }
  }
}

// Prepare verification request
const apiUrl = "https://api-sepolia.basescan.org/api";

const params = new URLSearchParams({
  apikey: apiKey,
  module: "contract",
  action: "verifysourcecode",
  contractaddress: contractAddress,
  sourceCode: source,
  codeformat: "solidity-single-file",
  contractname: "CipherTrail",
  compilerversion: "v0.8.24+commit.e11b9ed9",
  optimizationUsed: "1",
  runs: "200",
  constructorArguements: "", // no constructor args
  licenseType: "3", // MIT
});

console.log("Submitting verification to BaseScan...");
console.log("Contract:", contractAddress);

async function verify() {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const result = await response.json();
  console.log("Response:", result);

  if (result.status === "1") {
    console.log("\nVerification submitted! GUID:", result.result);
    console.log("Checking verification status...");

    // Poll for verification status
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      const checkParams = new URLSearchParams({
        apikey: apiKey,
        module: "contract",
        action: "checkverifystatus",
        guid: result.result,
      });

      const checkResponse = await fetch(`${apiUrl}?${checkParams.toString()}`);
      const checkResult = await checkResponse.json();
      console.log("Status:", checkResult.result);

      if (checkResult.result === "Pass - Verified") {
        console.log("\n=================================");
        console.log("Contract verified successfully!");
        console.log(`https://sepolia.basescan.org/address/${contractAddress}#code`);
        console.log("=================================");
        return;
      }

      if (checkResult.result.includes("Fail")) {
        console.error("Verification failed:", checkResult.result);
        return;
      }
    }

    console.log("Verification still pending. Check manually at:");
    console.log(`https://sepolia.basescan.org/address/${contractAddress}#code`);
  } else {
    console.error("Verification request failed:", result.result);
  }
}

verify().catch((e) => {
  console.error(e);
  process.exit(1);
});
