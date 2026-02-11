import { describe, it, expect } from "vitest";
import { computeCommitment, generateSalt } from "@/lib/commitment";
import { keccak256, encodePacked } from "viem";

describe("commitment", () => {
  it("computes same commitment as contract expects", () => {
    const answer = "hello";
    const salt = "0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`;
    const sender = "0x0000000000000000000000000000000000000001" as `0x${string}`;
    const day = 20000n;
    const commitment = computeCommitment(answer, salt, sender, day);
    const expected = keccak256(
      encodePacked(["string", "bytes32", "address", "uint256"], [answer, salt, sender, day])
    );
    expect(commitment).toBe(expected);
  });

  it("generateSalt returns 32-byte hex", () => {
    const salt = generateSalt();
    expect(salt.startsWith("0x")).toBe(true);
    expect(salt.length).toBe(66);
  });
});
