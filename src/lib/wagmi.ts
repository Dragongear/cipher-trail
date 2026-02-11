import { createConfig, http, injected } from "wagmi";
import { base, baseSepolia } from "viem/chains";

const isBase = process.env.NEXT_PUBLIC_CHAIN === "base";

const chains = isBase ? [base] as const : [baseSepolia] as const;

export const config = isBase
  ? createConfig({
      chains: [base],
      transports: { [base.id]: http() },
      connectors: [injected()],
      ssr: true,
    })
  : createConfig({
      chains: [baseSepolia],
      transports: { [baseSepolia.id]: http() },
      connectors: [injected()],
      ssr: true,
    });
