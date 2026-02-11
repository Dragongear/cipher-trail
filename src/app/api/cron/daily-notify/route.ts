import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDirectCast } from "@/lib/neynar";
import { getCurrentUTCDay } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET || "cron-secret";

export async function GET(req: NextRequest) {
  // Verify authorization
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const day = getCurrentUTCDay();

  // Get today's puzzle
  const puzzle = await prisma.puzzle.findUnique({
    where: { day },
  });

  if (!puzzle) {
    return NextResponse.json({ message: "No puzzle for today" });
  }

  // Get players who want daily notifications
  const players = await prisma.player.findMany({
    where: {
      notifyDaily: true,
      fid: { not: null },
    },
  });

  let notified = 0;
  let failed = 0;

  for (const player of players) {
    if (!player.fid) continue;

    const message = `New CipherTrail puzzle available: "${puzzle.title}"`;
    const success = await sendDirectCast(player.fid, message);

    if (success) {
      notified++;
    } else {
      failed++;
    }
  }

  return NextResponse.json({
    message: "Daily notifications sent",
    notified,
    failed,
    total: players.length,
  });
}
