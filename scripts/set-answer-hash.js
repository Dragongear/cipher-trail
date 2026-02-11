/**
 * Set the answer hash for a given day on CipherTrail contract.
 * Usage: CONTRACT_ADDRESS=0x... PRIVATE_KEY=0x... node scripts/set-answer-hash.js <day> <answer>
 * Example: CONTRACT_ADDRESS=0x... PRIVATE_KEY=0x... node scripts/set-answer-hash.js 20000 "hello"
 */
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { keccak256, encodePacked } from "viem";

const contractAddress = process.env.CONTRACT_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;
const day = process.argv[2];
const answer = process.argv[3];

if (!contractAddress || !privateKey || !day || !answer) {
  console.error(
    "Usage: CONTRACT_ADDRESS=0x... PRIVATE_KEY=0x... node scripts/set-answer-hash.js <day> <answer>"
  );
  process.exit(1);
}

const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});

const answerHash = keccak256(encodePacked(["string"], [answer]));

async function main() {
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: [
      {
        type: "function",
        name: "setAnswerHash",
        inputs: [
          { name: "day", type: "uint256" },
          { name: "_answerHash", type: "bytes32" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
    ],
    functionName: "setAnswerHash",
    args: [BigInt(day), answerHash],
  });

  console.log("Tx hash:", hash);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("Answer hash set for day", day);
  console.log("answerHash(bytes32):", answerHash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
