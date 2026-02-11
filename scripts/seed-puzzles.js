/**
 * Seed sample puzzles with different types and difficulties
 * Usage: npx tsx scripts/seed-puzzles.js
 */
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Hash answer for storage
function hashAnswer(answer) {
  return crypto.createHash("sha256").update(answer.toLowerCase().trim()).digest("hex");
}

const puzzles = [
  {
    puzzleType: "riddle",
    difficulty: "easy",
    title: "The Morning Question",
    content: "I have hands but cannot clap. I have a face but cannot smile. I tell you something all day long. What am I?",
    answer: "clock",
    hints: ["It's found in every home", "It has numbers on it", "It helps you not be late"],
    bonusMultiplier: 0.8,
  },
  {
    puzzleType: "cipher",
    difficulty: "medium",
    title: "Caesar's Secret",
    content: "Decode this message (shift 3): EORFNFKDLQ",
    answer: "blockchain",
    hints: ["Each letter is shifted by the same amount", "A becomes D, B becomes E...", "It's a technology term"],
    bonusMultiplier: 1.0,
  },
  {
    puzzleType: "pattern",
    difficulty: "medium",
    title: "Number Sequence",
    content: "What comes next in this sequence?\n\n1, 1, 2, 3, 5, 8, 13, ?",
    answer: "21",
    hints: ["Look at how each number relates to the previous ones", "This is a famous sequence", "Named after an Italian mathematician"],
    bonusMultiplier: 1.0,
  },
  {
    puzzleType: "riddle",
    difficulty: "hard",
    title: "The Ethereum Enigma",
    content: "I am the gas that fuels no car,\nIn blocks I live both near and far.\nMy uncle visits every round,\nIn proof of stake I can be found.\nWhat concept am I?",
    answer: "consensus",
    hints: ["It's about agreement", "Validators need to reach this", "Without it, no blocks are finalized"],
    bonusMultiplier: 1.5,
  },
  {
    puzzleType: "cipher",
    difficulty: "hard",
    title: "Binary Brain Teaser",
    content: "Decode this binary message:\n\n01000010 01000001 01010011 01000101",
    answer: "base",
    hints: ["Each group of 8 bits is one character", "Use ASCII encoding", "It's a four-letter word"],
    bonusMultiplier: 1.5,
  },
  {
    puzzleType: "pattern",
    difficulty: "easy",
    title: "Color Code",
    content: "If RED = 27, GREEN = 49, BLUE = 40, what does WHITE equal?",
    answer: "52",
    hints: ["Count something about the letters", "It's a sum", "Look at the position in the alphabet"],
    bonusMultiplier: 0.8,
  },
  {
    puzzleType: "riddle",
    difficulty: "medium",
    title: "The Web3 Wallet",
    content: "I hold your keys but I'm not a door,\nI sign your transactions, that's for sure.\nI can be hot or cold they say,\nWithout me, your coins can't stay.\nWhat am I?",
    answer: "wallet",
    hints: ["It's something you need in crypto", "MetaMask is one example", "It stores your private keys"],
    bonusMultiplier: 1.0,
  },
];

async function main() {
  const currentDay = Math.floor(Date.now() / 86400000);
  
  console.log("Seeding puzzles starting from day:", currentDay);
  
  for (let i = 0; i < puzzles.length; i++) {
    const p = puzzles[i];
    const day = currentDay + i;
    
    const existing = await prisma.puzzle.findUnique({ where: { day } });
    if (existing) {
      console.log(`Day ${day} already has a puzzle, skipping...`);
      continue;
    }
    
    await prisma.puzzle.create({
      data: {
        day,
        puzzleId: `puzzle-${day}`,
        title: p.title,
        content: p.content,
        hints: JSON.stringify(p.hints),
        puzzleType: p.puzzleType,
        difficulty: p.difficulty,
        answer: hashAnswer(p.answer),
        bonusMultiplier: p.bonusMultiplier,
      },
    });
    
    console.log(`Created puzzle for day ${day}: "${p.title}" (${p.puzzleType}, ${p.difficulty})`);
  }
  
  console.log("\nDone! Created", puzzles.length, "puzzles.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
