# CipherTrail – Daily Mystery Hunt (Base Mini App)

Daily puzzle game with **commit-reveal** onchain. Players solve clues offchain, commit a hash of their answer, then reveal to claim points. Faster solves earn more (time bonus).

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind
- **Web3:** wagmi, viem (Base / Base Sepolia)
- **DB:** Prisma + SQLite
- **Contract:** Solidity 0.8.24, Foundry

## Local setup

```bash
cp .env.example .env
# Edit .env: DATABASE_URL="file:./dev.db", set SESSION_SECRET, optional NEXT_PUBLIC_CONTRACT_ADDRESS

npm install
npx prisma generate
npx prisma db push
npm run db:seed   # seeds today's puzzle
npm run dev
```

## Contract (Foundry)

```bash
cd contracts
forge install
forge build
forge test
```

Deploy (example with Foundry):

```bash
export PRIVATE_KEY=0x...
export CONTRACT_ADDRESS=$(forge script script/Deploy.s.sol --broadcast --rpc-url $BASE_SEPOLIA_RPC_URL -vvv | grep "Contract Address" | awk '{print $3}')
```

Or use Hardhat/Remix and set `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env`.

## Setting daily answer hash (admin)

The contract stores `answerHash[day] = keccak256(answer)`. Only the owner can set it. **The server never stores or receives the plain answer.**

```bash
CONTRACT_ADDRESS=0x... PRIVATE_KEY=0x... npx tsx scripts/set-answer-hash.js <day> "<answer>"
```

Example for UTC day 20000 with answer "hello":

```bash
CONTRACT_ADDRESS=0xYourContract PRIVATE_KEY=0xOwnerKey npx tsx scripts/set-answer-hash.js 20000 "hello"
```

Run once per day (e.g. cron at 00:01 UTC) after you’ve chosen that day’s answer.

## Rotating puzzle content on the server

- **DB:** Use Prisma to create/update the `Puzzle` row for the day (title, content, imageUrl, hints JSON).
- **Seed:** `npm run db:seed` upserts a default puzzle for the current UTC day; you can change `prisma/seed.ts` or run one-off scripts to set real content.
- **Hints:** Stored as JSON array in `Puzzle.hints`. API `/api/puzzle/hint` returns one hint per request, rate-limited (per IP/wallet per day).

Never put the answer in the DB or in API responses; only set it onchain via `set-answer-hash.js`.

## Deployment (Vercel)

1. Push to GitHub, connect repo in Vercel.
2. Add env vars: `DATABASE_URL` (e.g. Turso/Neon if not SQLite), `NEXT_PUBLIC_CONTRACT_ADDRESS`, `NEXT_PUBLIC_CHAIN`, `NEXT_PUBLIC_APP_URL`, `SESSION_SECRET`.
3. For SQLite on Vercel you’ll need a file-based DB or switch to Postgres; for production, Postgres (e.g. Neon) is recommended.

## Base Mini App / Farcaster

- Put your app URL in `public/.well-known/farcaster.json` (frame.homeUrl, etc.).
- Generate `accountAssociation` (e.g. via [Base Build](https://docs.base.org/mini-apps/quickstart/new-apps/create-manifest)) and replace the placeholder in `farcaster.json`.

## Acceptance

- User can solve the daily puzzle with commit then reveal; server never sees the answer.
- Another user cannot steal the solution without the committer’s salt.
- Leaderboard is derived from onchain `Solved` events only.
