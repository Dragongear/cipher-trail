"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ConnectButton } from "@/components/ConnectButton";

export default function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetch("/api/leaderboard").then((r) => r.json()),
  });

  const entries = data?.entries ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl text-cipher-accent">
          CipherTrail
        </Link>
        <ConnectButton />
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>
        <p className="text-gray-400 text-sm mb-6">
          Points from onchain Solved events.
        </p>

        {isLoading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-cipher-card">
                <tr>
                  <th className="px-4 py-3 text-gray-400 font-medium">#</th>
                  <th className="px-4 py-3 text-gray-400 font-medium">Address</th>
                  <th className="px-4 py-3 text-gray-400 font-medium">Points</th>
                  <th className="px-4 py-3 text-gray-400 font-medium">Solves</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e: { address: string; points: number; solves: number }, i: number) => (
                  <tr
                    key={e.address}
                    className="border-t border-gray-800 hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-3 text-cipher-gold">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-sm truncate max-w-[180px]">
                      {e.address}
                    </td>
                    <td className="px-4 py-3">{e.points}</td>
                    <td className="px-4 py-3">{e.solves}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entries.length === 0 && (
              <p className="px-4 py-8 text-center text-gray-500">
                No solves yet. Be the first!
              </p>
            )}
          </div>
        )}

        <Link href="/" className="text-cipher-accent mt-6 inline-block">
          ← Back
        </Link>
      </main>
    </div>
  );
}
