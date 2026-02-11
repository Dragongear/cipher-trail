"use client";

import Link from "next/link";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { getTournamentConfig } from "@/lib/contracts";
import { parseEther, formatEther } from "viem";
import { useState } from "react";

export default function TournamentPage() {
  const { address } = useAccount();
  const tournamentConfig = getTournamentConfig();
  const [entering, setEntering] = useState(false);

  // Get current tournament ID
  const { data: currentId } = useReadContract({
    ...tournamentConfig,
    functionName: "currentTournamentId",
  });

  const tournamentId = currentId as bigint | undefined;

  // Get tournament details
  const { data: tournamentRaw, refetch: refetchTournament } = useReadContract({
    ...tournamentConfig,
    functionName: "getTournament",
    args: tournamentId ? [tournamentId] : undefined,
  });

  const tournament = tournamentRaw as readonly [bigint, bigint, bigint, bigint, bigint, boolean] | undefined;

  // Get player stats
  const { data: playerStatsRaw, refetch: refetchStats } = useReadContract({
    ...tournamentConfig,
    functionName: "getPlayerStats",
    args: tournamentId && address ? [tournamentId, address] : undefined,
  });

  const playerStats = playerStatsRaw as readonly [bigint, bigint, boolean, boolean] | undefined;

  // Get leaderboard
  const { data: leaderboardRaw } = useReadContract({
    ...tournamentConfig,
    functionName: "getLeaderboard",
    args: tournamentId ? [tournamentId, BigInt(10)] : undefined,
  });

  const leaderboard = leaderboardRaw as readonly [readonly `0x${string}`[], readonly bigint[]] | undefined;

  const { writeContractAsync } = useWriteContract();

  const handleEnter = async () => {
    if (!tournament) return;
    setEntering(true);
    try {
      await writeContractAsync({
        ...tournamentConfig,
        functionName: "enter",
        value: tournament[2], // entryFee
      });
      refetchTournament();
      refetchStats();
    } catch (e) {
      console.error(e);
    } finally {
      setEntering(false);
    }
  };

  // Calculate time remaining
  const currentDay = Math.floor(Date.now() / 86400000);
  const endDay = tournament ? Number(tournament[1]) : 0;
  const daysLeft = endDay - currentDay;

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
          <h1 className="text-2xl font-bold">Weekly Tournament</h1>
          <Link href="/" className="text-sm text-cipher-accent hover:underline">
            ← Back
          </Link>
        </div>

        {!tournamentId ? (
          <div className="rounded-lg bg-cipher-card border border-gray-700 p-6 text-center">
            <p className="text-gray-400">No active tournament</p>
          </div>
        ) : (
          <>
            {/* Tournament Info */}
            <div className="rounded-lg bg-cipher-card border border-gray-700 p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-cipher-gold font-semibold">Tournament #{String(tournamentId)}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  tournament?.[5] ? "bg-gray-700 text-gray-400" : "bg-green-900 text-green-300"
                }`}>
                  {tournament?.[5] ? "Ended" : `${daysLeft} days left`}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-400">Prize Pool</p>
                  <p className="text-xl font-bold text-cipher-gold">
                    {tournament ? formatEther(tournament[3]) : "0"} ETH
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Entry Fee</p>
                  <p className="text-xl font-bold">
                    {tournament ? formatEther(tournament[2]) : "0"} ETH
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Players</p>
                  <p className="text-xl font-bold">
                    {tournament ? String(tournament[4]) : "0"}
                  </p>
                </div>
              </div>
            </div>

            {/* Entry / Stats */}
            {address && (
              <div className="rounded-lg bg-cipher-card border border-gray-700 p-4 mb-6">
                {playerStats?.[2] ? (
                  <>
                    <h3 className="text-cipher-gold font-semibold mb-3">Your Progress</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Total Points</p>
                        <p className="text-2xl font-bold">{String(playerStats[0])}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Days Played</p>
                        <p className="text-2xl font-bold">{String(playerStats[1])}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-400 mb-4">
                      Enter the tournament to compete for prizes!
                    </p>
                    <button
                      onClick={handleEnter}
                      disabled={entering || tournament?.[5]}
                      className="px-6 py-2 rounded-lg bg-cipher-gold text-black font-medium disabled:opacity-50"
                    >
                      {entering ? "Entering..." : `Enter (${tournament ? formatEther(tournament[2]) : "0"} ETH)`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Leaderboard */}
            <div className="rounded-lg bg-cipher-card border border-gray-700 p-4">
              <h3 className="text-cipher-gold font-semibold mb-3">Leaderboard</h3>
              {leaderboard && leaderboard[0].length > 0 ? (
                <div className="space-y-2">
                  {leaderboard[0].map((player, i) => (
                    <div
                      key={player}
                      className={`flex items-center justify-between p-2 rounded ${
                        i < 3 ? "bg-cipher-dark" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                          i === 0 ? "bg-yellow-500 text-black" :
                          i === 1 ? "bg-gray-400 text-black" :
                          i === 2 ? "bg-amber-700 text-white" :
                          "bg-gray-700"
                        }`}>
                          {i + 1}
                        </span>
                        <span className="font-mono text-sm">
                          {player.slice(0, 6)}...{player.slice(-4)}
                        </span>
                        {player.toLowerCase() === address?.toLowerCase() && (
                          <span className="text-xs bg-cipher-accent px-1 rounded">You</span>
                        )}
                      </div>
                      <span className="font-bold">{String(leaderboard[1][i])} pts</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center">No players yet</p>
              )}
            </div>

            {/* Prize Distribution */}
            <div className="mt-4 p-4 border border-gray-700 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Prize Distribution</h4>
              <div className="flex justify-around text-center text-sm">
                <div>
                  <span className="text-yellow-500">1st</span>
                  <p className="font-bold">50%</p>
                </div>
                <div>
                  <span className="text-gray-400">2nd</span>
                  <p className="font-bold">30%</p>
                </div>
                <div>
                  <span className="text-amber-700">3rd</span>
                  <p className="font-bold">20%</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
