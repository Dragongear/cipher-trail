import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUTCDay } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const dayParam = request.nextUrl.searchParams.get("day");
  const day = dayParam ? parseInt(dayParam, 10) : getCurrentUTCDay();
  if (isNaN(day)) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }

  const puzzle = await prisma.puzzle.findUnique({
    where: { day },
  });
  if (!puzzle) {
    return NextResponse.json(
      { error: "No puzzle for this day", day },
      { status: 404 }
    );
  }

  let hints: string[] = [];
  try {
    hints = JSON.parse(puzzle.hints || "[]");
  } catch {
    hints = [];
  }

  return NextResponse.json({
    day: puzzle.day,
    puzzleId: puzzle.puzzleId,
    title: puzzle.title,
    content: puzzle.content,
    imageUrl: puzzle.imageUrl ?? undefined,
    hintCount: hints.length,
    puzzleType: puzzle.puzzleType ?? "riddle",
    difficulty: puzzle.difficulty ?? "medium",
    bonusMultiplier: puzzle.bonusMultiplier ?? 1.0,
    // never send answer or hints content until requested via /hint
  });
}
