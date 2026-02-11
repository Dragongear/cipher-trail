import { keccak256, encodePacked } from "viem";

/**
 * Compute commitment for CipherTrail contract.
 * commitment = keccak256(abi.encodePacked(answer, salt, sender, day))
 * Must match contract's expected format.
 */
export function computeCommitment(
  answer: string,
  salt: `0x${string}`,
  sender: `0x${string}`,
  day: bigint
): `0x${string}` {
  return keccak256(
    encodePacked(
      ["string", "bytes32", "address", "uint256"],
      [answer, salt, sender, day]
    )
  );
}

export function generateSalt(): `0x${string}` {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 32; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return ("0x" + Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")) as `0x${string}`;
}
