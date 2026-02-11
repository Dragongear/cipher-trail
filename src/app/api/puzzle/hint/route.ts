import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkHintRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { day, wallet, index = 0 } = body as {
      day?: number;
      wallet?: string;
      index?: number;
    };
    const dayNum = typeof day === "number" ? day : parseInt(String(day), 10);
    if (isNaN(dayNum)) {
      return NextResponse.json({ error: "Invalid day" }, { status: 400 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const key = wallet ? `hint:${wallet}:${dayNum}` : `hint:${ip}:${dayNum}`;
    const { ok, remaining } = checkHintRateLimit(key);
    if (!ok) {
      return NextResponse.json(
        { error: "Hint rate limit exceeded", remaining: 0 },
        { status: 429 }
      );
    }

    const puzzle = await prisma.puzzle.findUnique({
      where: { day: dayNum },
    });
    if (!puzzle) {
      return NextResponse.json({ error: "No puzzle for this day" }, { status: 404 });
    }

    let hints: string[] = [];
    try {
      hints = JSON.parse(puzzle.hints || "[]");
    } catch {
      hints = [];
    }

    const hintIndex = Math.min(Math.max(0, Math.floor(index)), hints.length - 1);
    const hint = hints[hintIndex] ?? null;

    return NextResponse.json({
      hint,
      hintIndex: hint !== null ? hintIndex : -1,
      remaining,
    });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
