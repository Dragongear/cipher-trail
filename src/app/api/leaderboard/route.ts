import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem } from "viem";
import { base, baseSepolia } from "viem/chains";
import { getContractAddress, getChain } from "@/lib/constants";

export async function GET() {
  const address = getContractAddress();
  if (address === "0x0000000000000000000000000000000000000000") {
    return NextResponse.json({
      entries: [],
      error: "Contract not configured",
    });
  }

  const chain = getChain();
  const rpc =
    chain.id === base.id ? "https://mainnet.base.org" : "https://sepolia.base.org";

  const client = createPublicClient({
    chain,
    transport: http(rpc),
  });

  const fromBlock = 0n;
  const toBlock = "latest";

  const logs = await client.getLogs({
    address,
    event: parseAbiItem(
      "event Solved(address indexed player, uint256 day, uint256 points)"
    ),
    fromBlock,
    toBlock,
  });

  const byAddress = new Map<string, { points: number; solves: number }>();
  for (const log of logs) {
    const player = (log.args as { player: string }).player;
    const points = Number((log.args as { points: bigint }).points);
    const cur = byAddress.get(player) || { points: 0, solves: 0 };
    cur.points += points;
    cur.solves += 1;
    byAddress.set(player, cur);
  }

  const entries = Array.from(byAddress.entries())
    .map(([address, data]) => ({ address, ...data }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 100);

  return NextResponse.json({ entries });
}
