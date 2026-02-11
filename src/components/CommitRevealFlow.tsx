"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { getContractConfig } from "@/lib/contracts";
import { computeCommitment, generateSalt } from "@/lib/commitment";
import { getCurrentUTCDay } from "@/lib/constants";
import Link from "next/link";

const DAY = BigInt(getCurrentUTCDay());

export function CommitRevealFlow() {
  const { address } = useAccount();
  const contract = getContractConfig();
  const [answer, setAnswer] = useState("");
  const [salt, setSalt] = useState<`0x${string}` | null>(null);
  const [step, setStep] = useState<"idle" | "commit" | "reveal">("idle");
  const [badgeClaimed, setBadgeClaimed] = useState(false);
  const [claimingBadge, setClaimingBadge] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<number[]>([]);

  const { data: hasCommitted } = useReadContract({
    ...contract,
    functionName: "hasCommitted",
    args: address ? [address, DAY] : undefined,
  });
  const { data: hasSolved } = useReadContract({
    ...contract,
    functionName: "hasSolved",
    args: address ? [address, DAY] : undefined,
  });

  const { writeContract: writeCommit, isPending: isCommitPending } =
    useWriteContract();
  const { writeContract: writeReveal, isPending: isRevealPending } =
    useWriteContract();

  const handleCommit = async () => {
    if (!address || !answer.trim()) return;
    const s = salt || generateSalt();
    if (!salt) setSalt(s);
    const commitment = computeCommitment(answer.trim(), s, address, DAY);
    await writeCommit({
      ...contract,
      functionName: "commit",
      args: [commitment, DAY],
    });
    setStep("commit");
  };

  const handleReveal = async () => {
    if (!address || !answer.trim() || !salt) return;
    await writeReveal({
      ...contract,
      functionName: "reveal",
      args: [answer.trim(), salt, DAY],
    });
    setStep("reveal");
  };

  const handleClaimBadge = async () => {
    if (!address) return;
    setClaimingBadge(true);
    try {
      const res = await fetch("/api/badges/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (data.success) {
        setBadgeClaimed(true);
        setEarnedBadges(data.badges || []);
      }
    } catch (e) {
      console.error("Claim failed:", e);
    } finally {
      setClaimingBadge(false);
    }
  };

  if (!address) {
    return (
      <p className="text-gray-400 text-sm">Connect wallet to commit or reveal.</p>
    );
  }

  if (hasSolved) {
    return (
      <div className="rounded-lg bg-green-900/20 border border-green-700/50 p-4 space-y-4">
        <p className="text-green-300">You already solved today&apos;s puzzle!</p>
        
        {!badgeClaimed ? (
          <button
            type="button"
            onClick={handleClaimBadge}
            disabled={claimingBadge}
            className="px-4 py-2 rounded-lg bg-cipher-gold text-black font-medium disabled:opacity-50"
          >
            {claimingBadge ? "Claiming..." : "🏅 Claim Badge"}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-green-400 font-medium">Badge claimed!</p>
            {earnedBadges.length > 0 && (
              <p className="text-sm text-gray-300">
                Badges earned: {earnedBadges.map(b => ["", "🎯", "🔥", "⚡", "👑", "🏆", "⏱️", "🌟"][b] || b).join(" ")}
              </p>
            )}
            <Link href="/badges" className="text-cipher-accent text-sm hover:underline">
              View all badges →
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg bg-cipher-card border border-gray-700 p-4">
      <h3 className="font-semibold text-cipher-gold">Commit & Reveal</h3>
      <p className="text-sm text-gray-400">
        Commit hashes your answer so others can&apos;t copy it. Reveal after the
        transaction confirms.
      </p>

      {!hasCommitted ? (
        <>
          <input
            type="text"
            placeholder="Your answer (never sent to server)"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-cipher-dark border border-gray-600 text-white placeholder-gray-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCommit}
              disabled={!answer.trim() || isCommitPending}
              className="px-4 py-2 rounded-lg bg-cipher-accent text-white font-medium disabled:opacity-50"
            >
              {isCommitPending ? "Confirm in wallet..." : "1. Commit"}
            </button>
          </div>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Same answer + salt used for commit"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-cipher-dark border border-gray-600 text-white placeholder-gray-500"
          />
          <p className="text-xs text-gray-500">
            Use the same answer you committed. Salt is stored in this tab.
          </p>
          <button
            type="button"
            onClick={handleReveal}
            disabled={!answer.trim() || !salt || isRevealPending}
            className="px-4 py-2 rounded-lg bg-cipher-gold text-black font-medium disabled:opacity-50"
          >
            {isRevealPending ? "Confirm in wallet..." : "2. Reveal"}
          </button>
        </>
      )}
    </div>
  );
}
