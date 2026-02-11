"use client";

import { useAccount, useReadContract } from "wagmi";
import { getContractConfig } from "@/lib/contracts";
import { getCurrentUTCDay } from "@/lib/constants";

interface ShareButtonProps {
  puzzleTitle?: string;
}

export function ShareButton({ puzzleTitle }: ShareButtonProps) {
  const { address } = useAccount();
  const contract = getContractConfig();
  const day = getCurrentUTCDay();

  const { data: hasSolved } = useReadContract({
    ...contract,
    functionName: "hasSolved",
    args: address ? [address, BigInt(day)] : undefined,
  });

  if (!hasSolved) return null;

  const shareText = puzzleTitle
    ? `I just solved "${puzzleTitle}" on CipherTrail!`
    : `I solved today's CipherTrail puzzle!`;

  const shareUrl = `https://dragongear-game.vercel.app?ref=${address?.slice(0, 8)}`;
  
  // Warpcast share URL format
  const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(
    `${shareText}\n\nTry it yourself:`
  )}&embeds[]=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="mt-4 p-4 rounded-lg bg-green-900/20 border border-green-700/50">
      <p className="text-green-300 font-semibold mb-3">Puzzle Solved!</p>
      <div className="flex gap-2">
        <a
          href={warpcastUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 1000 1000" fill="currentColor">
            <path d="M257.778 155.556h484.444v688.889h-71.111V528.889H711.11V288.89H288.89v240h40v315.555H257.78V155.556z"/>
          </svg>
          Share on Warpcast
        </a>
        <button
          onClick={() => {
            navigator.clipboard.writeText(shareUrl);
          }}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors"
        >
          Copy Link
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Share with friends and earn bonus points when they join!
      </p>
    </div>
  );
}
