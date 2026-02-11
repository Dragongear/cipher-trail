import { createConfig, http, injected } from "wagmi";
import { base, baseSepolia } from "viem/chains";

const isBase = process.env.NEXT_PUBLIC_CHAIN === "base";

export const config = createConfig({
  chains: isBase ? [base] : [baseSepolia],
  transports: isBase
    ? { [base.id]: http() }
    : { [baseSepolia.id]: http() },
  connectors: [injected()],
  ssr: true,
});
