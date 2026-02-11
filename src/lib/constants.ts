import { base, baseSepolia } from "viem/chains";

export function getChain() {
  const chainEnv = process.env.NEXT_PUBLIC_CHAIN || "base-sepolia";
  return chainEnv === "base" ? base : baseSepolia;
}

export function getContractAddress(): `0x${string}` {
  return (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`;
}

export function getCurrentUTCDay(): number {
  return Math.floor(Date.now() / 86400000);
}

export const SECONDS_PER_DAY = 86400;
