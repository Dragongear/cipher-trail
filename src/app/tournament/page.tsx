"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useBalance } from "wagmi";
import { parseEther, formatEther } from "viem";
import Link from "next/link";
import { ConnectButton } from "@/components/ConnectButton";
import { getCurrentUTCDay } from "@/lib/constants";
import tournamentAbi from "@/lib/tournament-abi.json";

const TOURNAMENT_CONTRACT = process.env.NEXT_PUBLIC_TOURNAMENT_CONTRACT as `0x${string}`;
const ENTRY_FEE = parseEther("0.001");

export default function TournamentPage() {
  const { address, isConnected } = useAccount();
  const day = BigInt(getCurrentUTCDay());
  const [enterPending, setEnterPending] = useState(false);

  const { data: balance } = useBalance({ address });

  const { data: tournamentInfo, refetch: refetchTournament } = useReadContract({
    address: TOURNAMENT_CONTRACT,
    abi: tournamentAbi,
    functionName: "getTournamentInfo",
    args: [day],
    query: {
      enabled: !!TOURNAMENT_CONTRACT,
      refetchInterval: 10000, // Refresh every 10s
    },
  });

  const { data: participantStatus, refetch: refetchStatus } = useReadContract({
    address: TOURNAMENT_CONTRACT,
    abi: tournamentAbi,
    functionName: "getParticipantStatus",
    args: address ? [day, address] : undefined,
    query: {
      enabled: !!address && !!TOURNAMENT_CONTRACT,
      refetchInterval: 10000,
    },
  });

  const { data: topSolvers } = useReadContract({
    address: TOURNAMENT_CONTRACT,
    abi: tournamentAbi,
    functionName: "getTopSolvers",
    args: [day, 10n],
    query: {
      enabled: !!TOURNAMENT_CONTRACT,
      refetchInterval: 10000,
    },
  });

  const { writeContractAsync } = useWriteContract();

  const handleEnterTournament = async () => {
    if (!address) return;
    setEnterPending(true);
    try {
      await writeContractAsync({
        address: TOURNAMENT_CONTRACT,
        abi: tournamentAbi,
        functionName: "enterTournament",
        value: ENTRY_FEE,
      });
      refetchTournament();
      refetchStatus();
    } catch (e) {
      console.error("Enter failed:", e);
    } finally {
      setEnterPending(false);
    }
  };

  const info = tournamentInfo as [bigint, bigint, bigint, boolean] | undefined;
  const status = participantStatus as [boolean, boolean, bigint] | undefined;
  const solvers = (topSolvers as `0x${string}`[]) || [];

  const prizePool = info ? Number(formatEther(info[0])) : 0;
  const participantCount = info ? Number(info[1]) : 0;
  const solverCount = info ? Number(info[2]) : 0;
  const isFinalized = info ? info[3] : false;

  const hasEntered = status ? status[0] : false;
  const hasSolved = status ? status[1] : false;
  const playerRank = status ? Number(status[2]) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl text-cipher-accent">
          CipherTrail
        </Link>
        <ConnectButton />
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🏆</span>
          <div>
            <h1 className="text-2xl font-bold">Daily Tournament</h1>
            <p className="text-gray-400 text-sm">Day {getCurrentUTCDay()}</p>
          </div>
        </div>

        {/* Prize Pool Card */}
        <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 rounded-xl p-6 border border-amber-700/50 mb-6">
          <div className="text-center">
            <p className="text-amber-400 text-sm uppercase tracking-wide mb-2">Prize Pool</p>
            <p className="text-4xl font-bold text-amber-300">{prizePool.toFixed(4)} ETH</p>
            <p className="text-gray-400 mt-2">{participantCount} participants</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 text-center">
            <div className="bg-amber-900/20 rounded-lg p-3">
              <p className="text-2xl">🥇</p>
              <p className="text-sm text-gray-300">50%</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-2xl">🥈</p>
              <p className="text-sm text-gray-300">30%</p>
            </div>
            <div className="bg-orange-900/20 rounded-lg p-3">
              <p className="text-2xl">🥉</p>
              <p className="text-sm text-gray-300">20%</p>
            </div>
          </div>
        </div>

        {/* Entry Section */}
        {!isConnected ? (
          <div className="text-center py-8 bg-cipher-card rounded-lg border border-gray-700">
            <p className="text-gray-400 mb-4">Connect wallet to enter tournament</p>
            <ConnectButton />
          </div>
        ) : !hasEntered ? (
          <div className="bg-cipher-card rounded-lg border border-gray-700 p-6 mb-6">
            <h3 className="font-semibold text-lg mb-2">Enter Today&apos;s Tournament</h3>
            <p className="text-gray-400 text-sm mb-4">
              Entry fee: 0.001 ETH. Top 3 fastest solvers split the prize pool!
            </p>
            <button
              type="button"
              onClick={handleEnterTournament}
              disabled={enterPending || (balance && balance.value < ENTRY_FEE)}
              className="w-full px-4 py-3 rounded-lg bg-cipher-gold text-black font-bold disabled:opacity-50"
            >
              {enterPending ? "Confirming..." : "Enter Tournament (0.001 ETH)"}
            </button>
            {balance && balance.value < ENTRY_FEE && (
              <p className="text-red-400 text-sm mt-2">Insufficient balance</p>
            )}
          </div>
        ) : (
          <div className="bg-green-900/20 rounded-lg border border-green-700/50 p-6 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-green-300">You&apos;re in!</p>
                {hasSolved ? (
                  <p className="text-gray-300 text-sm">
                    Solved! Your rank: #{playerRank}
                  </p>
                ) : (
                  <p className="text-gray-300 text-sm">
                    Solve the puzzle to compete for prizes
                  </p>
                )}
              </div>
            </div>
            {!hasSolved && (
              <Link
                href="/puzzle"
                className="mt-4 block text-center px-4 py-2 rounded-lg bg-cipher-accent text-white"
              >
                Go to Puzzle →
              </Link>
            )}
          </div>
        )}

        {/* Live Leaderboard */}
        <div className="bg-cipher-card rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold">Live Race</h3>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {solverCount} solved
            </span>
          </div>

          {solvers.length === 0 ? (
            <p className="px-4 py-8 text-center text-gray-500">
              No solvers yet. Be the first!
            </p>
          ) : (
            <div className="divide-y divide-gray-800">
              {solvers.map((solver, i) => (
                <div
                  key={solver}
                  className={`px-4 py-3 flex items-center gap-3 ${
                    solver.toLowerCase() === address?.toLowerCase()
                      ? "bg-cipher-accent/10"
                      : ""
                  }`}
                >
                  <span className="text-xl">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <span className="font-mono text-sm truncate flex-1">
                    {solver.slice(0, 6)}...{solver.slice(-4)}
                  </span>
                  {solver.toLowerCase() === address?.toLowerCase() && (
                    <span className="text-xs text-cipher-accent">You</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contract link */}
        {TOURNAMENT_CONTRACT && (
          <p className="text-center text-gray-500 text-xs mt-6">
            Contract:{" "}
            <a
              href={`https://sepolia.basescan.org/address/${TOURNAMENT_CONTRACT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cipher-accent hover:underline"
            >
              {TOURNAMENT_CONTRACT.slice(0, 6)}...{TOURNAMENT_CONTRACT.slice(-4)}
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
