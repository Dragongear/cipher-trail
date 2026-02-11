"use client";

import { useConnect, useAccount, useDisconnect } from "wagmi";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400 truncate max-w-[140px]">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          type="button"
          onClick={() => disconnect()}
          className="px-3 py-1.5 rounded-lg bg-cipher-card border border-gray-600 text-sm hover:bg-gray-800"
        >
          Disconnect
        </button>
      </div>
    );
  }

  const c = connectors[0];
  return (
    <button
      type="button"
      onClick={() => c && connect({ connector: c })}
      disabled={isPending}
      className="px-4 py-2 rounded-lg bg-cipher-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
    >
      {isPending ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
