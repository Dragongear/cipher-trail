import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserByAddress } from "@/lib/neynar";

export const dynamic = "force-dynamic";

// POST - Subscribe to notifications
export async function POST(req: NextRequest) {
  try {
    const { wallet, notifyDaily, notifyStreak } = await req.json();

    if (!wallet) {
      return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
    }

    const normalizedWallet = wallet.toLowerCase();

    // Get or create player
    let player = await prisma.player.findUnique({
      where: { wallet: normalizedWallet },
    });

    // Try to get FID from Neynar
    let fid = player?.fid;
    if (!fid) {
      const farcasterUser = await getUserByAddress(normalizedWallet);
      fid = farcasterUser?.fid ?? null;
    }

    if (!player) {
      player = await prisma.player.create({
        data: {
          wallet: normalizedWallet,
          fid,
          notifyDaily: notifyDaily ?? false,
          notifyStreak: notifyStreak ?? false,
        },
      });
    } else {
      player = await prisma.player.update({
        where: { wallet: normalizedWallet },
        data: {
          fid: fid ?? player.fid,
          notifyDaily: notifyDaily ?? player.notifyDaily,
          notifyStreak: notifyStreak ?? player.notifyStreak,
        },
      });
    }

    return NextResponse.json({
      success: true,
      fid: player.fid,
      notifyDaily: player.notifyDaily,
      notifyStreak: player.notifyStreak,
    });
  } catch (error) {
    console.error("Notification subscription error:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

// GET - Get notification preferences
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({
    where: { wallet: wallet.toLowerCase() },
  });

  if (!player) {
    return NextResponse.json({
      fid: null,
      notifyDaily: false,
      notifyStreak: false,
    });
  }

  return NextResponse.json({
    fid: player.fid,
    notifyDaily: player.notifyDaily,
    notifyStreak: player.notifyStreak,
  });
}
