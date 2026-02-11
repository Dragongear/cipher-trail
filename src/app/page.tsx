import Link from "next/link";
import { ConnectButton } from "@/components/ConnectButton";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl text-cipher-accent">
          CipherTrail
        </Link>
        <ConnectButton />
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Daily Mystery Hunt</h1>
        <p className="text-gray-400 mb-8">
          Solve the daily puzzle. Commit your answer onchain, then reveal to
          claim points. Faster solves earn more.
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/puzzle"
            className="block rounded-lg bg-cipher-card border border-gray-700 p-6 text-center hover:border-cipher-accent transition-colors"
          >
            <span className="text-cipher-gold font-semibold">Today&apos;s Puzzle</span>
            <p className="text-sm text-gray-400 mt-1">View clues and submit</p>
          </Link>
          <Link
            href="/leaderboard"
            className="block rounded-lg bg-cipher-card border border-gray-700 p-6 text-center hover:border-cipher-accent transition-colors"
          >
            <span className="text-cipher-gold font-semibold">Leaderboard</span>
            <p className="text-sm text-gray-400 mt-1">Onchain points</p>
          </Link>
          <Link
            href="/badges"
            className="block rounded-lg bg-cipher-card border border-gray-700 p-6 text-center hover:border-cipher-accent transition-colors"
          >
            <span className="text-cipher-gold font-semibold">🏅 Achievements</span>
            <p className="text-sm text-gray-400 mt-1">Collect soulbound badges</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
