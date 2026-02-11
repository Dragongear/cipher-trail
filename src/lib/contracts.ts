import { getContractAddress } from "./constants";

export const CIPHER_TRAIL_ABI = [
  {
    type: "function",
    name: "commit",
    inputs: [
      { name: "commitment", type: "bytes32", internalType: "bytes32" },
      { name: "day", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "reveal",
    inputs: [
      { name: "answer", type: "string", internalType: "string" },
      { name: "salt", type: "bytes32", internalType: "bytes32" },
      { name: "day", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getCurrentDay",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasCommitted",
    inputs: [
      { name: "player", type: "address", internalType: "address" },
      { name: "day", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasSolved",
    inputs: [
      { name: "", type: "address", internalType: "address" },
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "commitments",
    inputs: [
      { name: "", type: "address", internalType: "address" },
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Solved",
    inputs: [
      { name: "player", type: "address", indexed: true, internalType: "address" },
      { name: "day", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "points", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Committed",
    inputs: [
      { name: "player", type: "address", indexed: true, internalType: "address" },
      { name: "day", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "commitment", type: "bytes32", indexed: false, internalType: "bytes32" },
    ],
    anonymous: false,
  },
] as const;

export function getContractConfig() {
  return {
    address: getContractAddress(),
    abi: CIPHER_TRAIL_ABI,
  } as const;
}
