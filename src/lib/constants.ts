import { base, baseSepolia } from "viem/chains";

export function getChain() {
  const chainEnv = process.env.NEXT_PUBLIC_CHAIN || "base-sepolia";
  return chainEnv === "base" ? base : baseSepolia;
}

export function getContractAddress(): `0x${string}` {
  return (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`;
}

export function getBadgesAddress(): `0x${string}` {
  return (process.env.NEXT_PUBLIC_BADGES_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`;
}

export function getTournamentAddress(): `0x${string}` {
  return (process.env.NEXT_PUBLIC_TOURNAMENT_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`;
}

export function getCurrentUTCDay(): number {
  return Math.floor(Date.now() / 86400000);
}

export const SECONDS_PER_DAY = 86400;

// Badge type IDs (must match CipherAchievements contract)
export const BADGE_TYPES = {
  FIRST_SOLVE: 1,
  STREAK_3: 2,
  STREAK_7: 3,
  STREAK_30: 4,
  SOLVES_10: 5,
  SOLVES_50: 6,
  SOLVES_100: 7,
  SPEED_DEMON: 8,
} as const;

export const BADGE_INFO: Record<number, { name: string; description: string; icon: string }> = {
  1: { name: "First Solve", description: "Solved your first puzzle", icon: "🎯" },
  2: { name: "3-Day Streak", description: "3 consecutive days", icon: "🔥" },
  3: { name: "Week Warrior", description: "7 consecutive days", icon: "⚔️" },
  4: { name: "Monthly Master", description: "30 consecutive days", icon: "👑" },
  5: { name: "10 Solves", description: "Solved 10 puzzles", icon: "🔟" },
  6: { name: "50 Solves", description: "Solved 50 puzzles", icon: "🏅" },
  7: { name: "Century Solver", description: "Solved 100 puzzles", icon: "💯" },
  8: { name: "Speed Demon", description: "Solved with max bonus", icon: "⚡" },
};
