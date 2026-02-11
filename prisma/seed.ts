import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function main() {
  const today = Math.floor(Date.now() / 86400000);
  await prisma.puzzle.upsert({
    where: { day: today },
    create: {
      day: today,
      puzzleId: `puzzle-${today}`,
      title: "Welcome Puzzle",
      content:
        "Decode the message: 8-5-12-12-15. Each number is the position in the alphabet (A=1). What word do you get?",
      hints: JSON.stringify([
        "A=1, B=2, C=3...",
        "The word means 'hello' in a common language.",
        "Hello",
      ]),
    },
    update: {},
  });
  console.log("Seeded puzzle for day", today);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
