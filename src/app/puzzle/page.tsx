"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ConnectButton } from "@/components/ConnectButton";
import { CommitRevealFlow } from "@/components/CommitRevealFlow";
import { getCurrentUTCDay } from "@/lib/constants";

export default function PuzzlePage() {
  const [puzzle, setPuzzle] = useState<{
    day: number;
    puzzleId: string;
    title: string;
    content: string;
    imageUrl?: string;
    hintCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [hintIndex, setHintIndex] = useState(0);

  const day = getCurrentUTCDay();

  useEffect(() => {
    fetch(`/api/puzzle?day=${day}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPuzzle(data);
      })
      .catch(() => setError("Failed to load puzzle"))
      .finally(() => setLoading(false));
  }, [day]);

  const requestHint = async () => {
    const res = await fetch("/api/puzzle/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, index: hintIndex }),
    });
    const data = await res.json();
    if (data.hint != null) {
      setHint(data.hint);
      setHintIndex((i) => i + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading puzzle...</p>
      </div>
    );
  }

  if (error || !puzzle) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-gray-800 px-4 py-3 flex justify-between items-center">
          <Link href="/" className="font-bold text-xl text-cipher-accent">
            CipherTrail
          </Link>
          <ConnectButton />
        </header>
        <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
          <p className="text-red-400">{error || "Puzzle not found"}</p>
          <Link href="/" className="text-cipher-accent mt-4 inline-block">
            ← Back
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl text-cipher-accent">
          CipherTrail
        </Link>
        <ConnectButton />
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <span className="text-gray-500 text-sm">Day {puzzle.day}</span>
          <h1 className="text-2xl font-bold mt-1">{puzzle.title}</h1>
        </div>

        <div className="rounded-lg bg-cipher-card border border-gray-700 p-6 mb-6">
          <p className="whitespace-pre-wrap text-gray-200">{puzzle.content}</p>
          {puzzle.imageUrl && (
            <img
              src={puzzle.imageUrl}
              alt="Puzzle"
              className="mt-4 rounded-lg max-w-full"
            />
          )}
        </div>

        <div className="mb-6">
          <button
            type="button"
            onClick={requestHint}
            className="text-sm text-cipher-accent hover:underline"
          >
            Get a hint ({puzzle.hintCount} available)
          </button>
          {hint && (
            <p className="mt-2 p-3 rounded-lg bg-gray-800/50 text-gray-300 text-sm">
              {hint}
            </p>
          )}
        </div>

        <CommitRevealFlow />
      </main>
    </div>
  );
}
