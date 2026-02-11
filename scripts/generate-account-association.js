import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";
import { base } from "viem/chains";

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("Set PRIVATE_KEY env var");
  process.exit(1);
}

const domain = "dragongear-game.vercel.app";

// Base64url encode
function base64url(data) {
  const base64 = Buffer.from(data).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function main() {
  const account = privateKeyToAccount(privateKey);
  console.log("Signing with address:", account.address);
  console.log("Domain:", domain);

  // Create header and payload
  const header = {
    fid: 2689152, // pulsenet FID
    type: "custody",
    key: account.address.toLowerCase(),
  };

  const payload = {
    domain: domain,
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));

  // Message to sign: header.payload
  const message = `${headerB64}.${payloadB64}`;

  // Sign the message
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(),
  });

  const signature = await walletClient.signMessage({ message });
  const signatureB64 = base64url(Buffer.from(signature.slice(2), "hex"));

  const accountAssociation = {
    header: headerB64,
    payload: payloadB64,
    signature: signatureB64,
  };

  console.log("\n=== Account Association ===\n");
  console.log(JSON.stringify(accountAssociation, null, 2));
  console.log("\n=== For farcaster.json ===\n");
  console.log(`"accountAssociation": ${JSON.stringify(accountAssociation)}`);
}

main().catch(console.error);
