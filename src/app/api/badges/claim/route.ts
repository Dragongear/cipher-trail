import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import badgesAbi from "@/lib/badges-abi.json";
import contractAbi from "@/lib/contract-abi.json";
import { getCurrentUTCDay } from "@/lib/constants";

export const dynamic = "force-dynamic";

const BADGES_CONTRACT = process.env.NEXT_PUBLIC_BADGES_CONTRACT as `0x${string}`;
const GAME_CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});

export async function POST(request: Request) {
  try {
    const { address } = await request.json();

    if (!address || !BADGES_CONTRACT || !PRIVATE_KEY) {
      return NextResponse.json({ error: "Missing config" }, { status: 400 });
    }

    const day = BigInt(getCurrentUTCDay());

    // Check if user has solved today's puzzle in the game contract
    const hasSolved = await publicClient.readContract({
      address: GAME_CONTRACT,
      abi: contractAbi,
      functionName: "hasSolved",
      args: [address, day],
    });

    if (!hasSolved) {
      return NextResponse.json({ error: "Not solved today" }, { status: 400 });
    }

    // Check if already has First Solve badge
    const hasBadge = await publicClient.readContract({
      address: BADGES_CONTRACT,
      abi: badgesAbi,
      functionName: "hasBadge",
      args: [address, 1n], // BADGE_FIRST_SOLVE = 1
    });

    if (hasBadge) {
      // Already has badge, just return streak info
      const streakInfo = await publicClient.readContract({
        address: BADGES_CONTRACT,
        abi: badgesAbi,
        functionName: "getStreakInfo",
        args: [address],
      }) as [bigint, bigint];

      const badges = await publicClient.readContract({
        address: BADGES_CONTRACT,
        abi: badgesAbi,
        functionName: "getPlayerBadges",
        args: [address],
      }) as bigint[];

      return NextResponse.json({
        success: true,
        message: "Already claimed",
        streak: Number(streakInfo[0]),
        badges: badges.map(Number),
      });
    }

    // Calculate if this is first hour solve
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const hoursSinceStart = (now.getTime() - startOfDay.getTime()) / (1000 * 60 * 60);
    const isFirstHour = hoursSinceStart <= 1;

    // TODO: Check if top 10 (would need to count Solved events for today)
    const isTopTen = false;

    // Create wallet client with owner key to call recordSolve
    const account = privateKeyToAccount(PRIVATE_KEY);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http("https://sepolia.base.org"),
    });

    // Call recordSolve which will mint appropriate badges
    const hash = await walletClient.writeContract({
      address: BADGES_CONTRACT,
      abi: badgesAbi,
      functionName: "recordSolve",
      args: [address, day, isTopTen, isFirstHour],
    });

    // Wait for transaction
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Get updated badges
    const badges = await publicClient.readContract({
      address: BADGES_CONTRACT,
      abi: badgesAbi,
      functionName: "getPlayerBadges",
      args: [address],
    }) as bigint[];

    const streakInfo = await publicClient.readContract({
      address: BADGES_CONTRACT,
      abi: badgesAbi,
      functionName: "getStreakInfo",
      args: [address],
    }) as [bigint, bigint];

    return NextResponse.json({
      success: true,
      txHash: hash,
      badges: badges.map(Number),
      streak: Number(streakInfo[0]),
    });
  } catch (error) {
    console.error("Badge claim error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to claim badge" },
      { status: 500 }
    );
  }
}
