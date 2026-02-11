"use client";

import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { getBadgesConfig } from "@/lib/contracts";
import { BADGE_INFO } from "@/lib/constants";

export default function BadgesPage() {
  const { address } = useAccount();
  const badgesConfig = getBadgesConfig();

  // Get player stats (totalSolves, streak, bestStreak, badgeCount)
  const { data: playerStats, isLoading: loadingStats } = useReadContract({
    ...badgesConfig,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
  });

  // Check which badges the player has
  const { data: hasFirstSolve } = useReadContract({
    ...badgesConfig,
    functionName: "hasBadge",
    args: address ? [address, BigInt(1)] : undefined,
  });
  const { data: hasStreak3 } = useReadContract({
    ...badgesConfig,
    functionName: "hasBadge",
    args: address ? [address, BigInt(2)] : undefined,
  });
  const { data: hasStreak7 } = useReadContract({
    ...badgesConfig,
    functionName: "hasBadge",
    args: address ? [address, BigInt(3)] : undefined,
  });
  const { data: hasStreak30 } = useReadContract({
    ...badgesConfig,
    functionName: "hasBadge",
    args: address ? [address, BigInt(4)] : undefined,
  });
  const { data: hasSolves10 } = useReadContract({
    ...badgesConfig,
    functionName: "hasBadge",
    args: address ? [address, BigInt(5)] : undefined,
  });
  const { data: hasSolves50 } = useReadContract({
    ...badgesConfig,
    functionName: "hasBadge",
    args: address ? [address, BigInt(6)] : undefined,
  });
  const { data: hasSolves100 } = useReadContract({
    ...badgesConfig,
    functionName: "hasBadge",
    args: address ? [address, BigInt(7)] : undefined,
  });
  const { data: hasSpeedDemon } = useReadContract({
    ...badgesConfig,
    functionName: "hasBadge",
    args: address ? [address, BigInt(8)] : undefined,
  });

  const badgeStatus: Record<number, boolean> = {
    1: Boolean(hasFirstSolve),
    2: Boolean(hasStreak3),
    3: Boolean(hasStreak7),
    4: Boolean(hasStreak30),
    5: Boolean(hasSolves10),
    6: Boolean(hasSolves50),
    7: Boolean(hasSolves100),
    8: Boolean(hasSpeedDemon),
  };

  const allBadgeIds = Object.keys(BADGE_INFO).map(Number);
  const earnedCount = Object.values(badgeStatus).filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl text-cipher-accent">
          CipherTrail
        </Link>
        <ConnectButton />
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Achievements</h1>
          <Link href="/" className="text-sm text-cipher-accent hover:underline">
            ← Back
          </Link>
        </div>

        {!address ? (
          <div className="rounded-lg bg-cipher-card border border-gray-700 p-6 text-center">
            <p className="text-gray-400">Connect your wallet to view achievements</p>
          </div>
        ) : (
          <>
            {/* Stats Card */}
            <div className="rounded-lg bg-cipher-card border border-gray-700 p-4 mb-6">
              <h3 className="text-cipher-gold font-semibold mb-3">Your Stats</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Total Solves</p>
                  <p className="text-2xl font-bold">
                    {playerStats ? Number(playerStats[0]) : 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Current Streak</p>
                  <p className="text-2xl font-bold">
                    {playerStats ? Number(playerStats[1]) : 0}
                    <span className="text-sm text-gray-500 ml-1">days</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Best Streak</p>
                  <p className="text-2xl font-bold">
                    {playerStats ? Number(playerStats[2]) : 0}
                    <span className="text-sm text-gray-500 ml-1">days</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Badges Grid */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-cipher-gold font-semibold">All Badges</h3>
              <span className="text-sm text-gray-400">
                {earnedCount} / {allBadgeIds.length} earned
              </span>
            </div>
            {loadingStats ? (
              <p className="text-gray-400">Loading...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {allBadgeIds.map((id) => {
                  const badge = BADGE_INFO[id];
                  const earned = badgeStatus[id];
                  return (
                    <div
                      key={id}
                      className={`rounded-lg border p-4 text-center transition-all ${
                        earned
                          ? "bg-cipher-card border-cipher-gold"
                          : "bg-cipher-dark border-gray-700 opacity-50"
                      }`}
                    >
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <p className="font-semibold text-sm">{badge.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
                      {earned && (
                        <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-cipher-gold text-black rounded">
                          Earned
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
