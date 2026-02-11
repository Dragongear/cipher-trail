"use client";

import { useAccount, useReadContract } from "wagmi";
import Link from "next/link";
import { ConnectButton } from "@/components/ConnectButton";
import badgesAbi from "@/lib/badges-abi.json";

const BADGES_CONTRACT = process.env.NEXT_PUBLIC_BADGES_CONTRACT as `0x${string}`;

// Badge metadata
const BADGE_INFO = [
  {
    id: 1,
    name: "First Solve",
    description: "Solve your first puzzle",
    icon: "🎯",
    rarity: "Common",
    color: "from-green-500 to-emerald-600",
  },
  {
    id: 2,
    name: "3-Day Streak",
    description: "Solve puzzles 3 days in a row",
    icon: "🔥",
    rarity: "Common",
    color: "from-orange-400 to-red-500",
  },
  {
    id: 3,
    name: "7-Day Streak",
    description: "A full week of puzzles",
    icon: "⚡",
    rarity: "Uncommon",
    color: "from-yellow-400 to-orange-500",
  },
  {
    id: 4,
    name: "30-Day Streak",
    description: "Legendary dedication!",
    icon: "👑",
    rarity: "Legendary",
    color: "from-purple-500 to-pink-600",
  },
  {
    id: 5,
    name: "Top 10",
    description: "Finish in daily top 10",
    icon: "🏆",
    rarity: "Rare",
    color: "from-amber-400 to-yellow-500",
  },
  {
    id: 6,
    name: "Speed Demon",
    description: "Solve in the first hour",
    icon: "⏱️",
    rarity: "Rare",
    color: "from-cyan-400 to-blue-500",
  },
  {
    id: 7,
    name: "Early Adopter",
    description: "One of the first 100 players",
    icon: "🌟",
    rarity: "Legendary",
    color: "from-indigo-500 to-purple-600",
  },
];

const RARITY_COLORS: Record<string, string> = {
  Common: "text-gray-400",
  Uncommon: "text-green-400",
  Rare: "text-blue-400",
  Legendary: "text-purple-400",
};

export default function BadgesPage() {
  const { address, isConnected } = useAccount();

  const { data: playerBadges, isLoading } = useReadContract({
    address: BADGES_CONTRACT,
    abi: badgesAbi,
    functionName: "getPlayerBadges",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!BADGES_CONTRACT,
    },
  });

  const { data: streakInfo } = useReadContract({
    address: BADGES_CONTRACT,
    abi: badgesAbi,
    functionName: "getStreakInfo",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!BADGES_CONTRACT,
    },
  });

  const earnedBadges = (playerBadges as bigint[]) || [];
  const earnedSet = new Set(earnedBadges.map((b) => Number(b)));
  const streak = streakInfo ? Number((streakInfo as [bigint, bigint])[0]) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl text-cipher-accent">
          CipherTrail
        </Link>
        <ConnectButton />
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-2">Achievement Badges</h1>
        <p className="text-gray-400 text-sm mb-8">
          Collect soulbound NFT badges for your achievements. These badges are non-transferable and prove your skills onchain!
        </p>

        {/* Stats */}
        {isConnected && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-cipher-card rounded-lg p-4 text-center border border-gray-700">
              <div className="text-2xl font-bold text-cipher-gold">{earnedSet.size}</div>
              <div className="text-gray-400 text-sm">Badges Earned</div>
            </div>
            <div className="bg-cipher-card rounded-lg p-4 text-center border border-gray-700">
              <div className="text-2xl font-bold text-orange-400">{streak} 🔥</div>
              <div className="text-gray-400 text-sm">Current Streak</div>
            </div>
            <div className="bg-cipher-card rounded-lg p-4 text-center border border-gray-700">
              <div className="text-2xl font-bold text-purple-400">{7 - earnedSet.size}</div>
              <div className="text-gray-400 text-sm">To Collect</div>
            </div>
          </div>
        )}

        {!isConnected ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">Connect your wallet to view your badges</p>
            <ConnectButton />
          </div>
        ) : isLoading ? (
          <p className="text-gray-400">Loading badges...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BADGE_INFO.map((badge) => {
              const earned = earnedSet.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`relative rounded-xl p-6 border transition-all ${
                    earned
                      ? "border-cipher-gold bg-gradient-to-br " + badge.color + " bg-opacity-10"
                      : "border-gray-700 bg-cipher-card opacity-50 grayscale"
                  }`}
                >
                  {/* Badge icon */}
                  <div className="text-4xl mb-3">{badge.icon}</div>

                  {/* Badge name */}
                  <h3 className="font-bold text-lg mb-1">{badge.name}</h3>

                  {/* Description */}
                  <p className="text-gray-300 text-sm mb-3">{badge.description}</p>

                  {/* Rarity */}
                  <span className={`text-xs font-medium ${RARITY_COLORS[badge.rarity]}`}>
                    {badge.rarity}
                  </span>

                  {/* Earned indicator */}
                  {earned && (
                    <div className="absolute top-3 right-3 bg-cipher-gold text-black text-xs font-bold px-2 py-1 rounded">
                      EARNED
                    </div>
                  )}

                  {/* Locked indicator */}
                  {!earned && (
                    <div className="absolute top-3 right-3 text-gray-500">
                      🔒
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Contract link */}
        {BADGES_CONTRACT && (
          <p className="text-center text-gray-500 text-xs mt-8">
            Contract:{" "}
            <a
              href={`https://sepolia.basescan.org/address/${BADGES_CONTRACT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cipher-accent hover:underline"
            >
              {BADGES_CONTRACT.slice(0, 6)}...{BADGES_CONTRACT.slice(-4)}
            </a>
          </p>
        )}

        <Link href="/" className="text-cipher-accent mt-6 inline-block">
          ← Back
        </Link>
      </main>
    </div>
  );
}
