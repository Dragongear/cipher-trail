import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST - Register a referral
export async function POST(req: NextRequest) {
  try {
    const { wallet, referrerCode } = await req.json();

    if (!wallet || !referrerCode) {
      return NextResponse.json(
        { error: "Missing wallet or referrer code" },
        { status: 400 }
      );
    }

    const normalizedWallet = wallet.toLowerCase();
    const normalizedCode = referrerCode.toLowerCase();

    // Check if user already exists
    const existingPlayer = await prisma.player.findUnique({
      where: { wallet: normalizedWallet },
    });

    if (existingPlayer) {
      return NextResponse.json({ message: "Already registered" });
    }

    // Find referrer by wallet prefix (first 8 chars)
    const referrer = await prisma.player.findFirst({
      where: {
        wallet: {
          startsWith: normalizedCode,
        },
      },
    });

    if (!referrer) {
      // Create player without referral
      await prisma.player.create({
        data: { wallet: normalizedWallet },
      });
      return NextResponse.json({ message: "Registered without referrer" });
    }

    // Create player and referral in transaction
    await prisma.$transaction([
      prisma.player.create({
        data: { wallet: normalizedWallet },
      }),
      prisma.referral.create({
        data: {
          referrer: referrer.wallet,
          referee: normalizedWallet,
        },
      }),
      prisma.player.update({
        where: { wallet: referrer.wallet },
        data: {
          referralCount: { increment: 1 },
          bonusPoints: { increment: 50 }, // 50 bonus points per referral
        },
      }),
    ]);

    return NextResponse.json({
      message: "Registered with referral",
      referrer: referrer.wallet,
    });
  } catch (error) {
    console.error("Referral error:", error);
    return NextResponse.json(
      { error: "Failed to process referral" },
      { status: 500 }
    );
  }
}

// GET - Get player stats
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
  }

  const normalizedWallet = wallet.toLowerCase();

  let player = await prisma.player.findUnique({
    where: { wallet: normalizedWallet },
  });

  // Auto-create player if not exists
  if (!player) {
    player = await prisma.player.create({
      data: { wallet: normalizedWallet },
    });
  }

  return NextResponse.json({
    referralCode: player.wallet.slice(0, 8),
    referralCount: player.referralCount,
    bonusPoints: player.bonusPoints,
    shareUrl: `https://dragongear-game.vercel.app?ref=${player.wallet.slice(0, 8)}`,
  });
}
