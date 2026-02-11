/**
 * Neynar API client for Farcaster notifications
 * Docs: https://docs.neynar.com
 */

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "";
const NEYNAR_BASE_URL = "https://api.neynar.com/v2";

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfp?: { url: string };
  custody_address?: string;
  verifications?: string[];
}

/**
 * Get user by Ethereum address
 */
export async function getUserByAddress(address: string): Promise<FarcasterUser | null> {
  if (!NEYNAR_API_KEY) return null;

  try {
    const res = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/user/by_verification?address=${address}`,
      {
        headers: {
          accept: "application/json",
          "x-api-key": NEYNAR_API_KEY,
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data.user || null;
  } catch (error) {
    console.error("Neynar getUserByAddress error:", error);
    return null;
  }
}

/**
 * Get user by FID
 */
export async function getUserByFid(fid: number): Promise<FarcasterUser | null> {
  if (!NEYNAR_API_KEY) return null;

  try {
    const res = await fetch(`${NEYNAR_BASE_URL}/farcaster/user?fid=${fid}`, {
      headers: {
        accept: "application/json",
        "x-api-key": NEYNAR_API_KEY,
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.user || null;
  } catch (error) {
    console.error("Neynar getUserByFid error:", error);
    return null;
  }
}

/**
 * Send a direct cast (DM) to a user
 * Note: Requires paid Neynar plan for signer
 */
export async function sendDirectCast(
  recipientFid: number,
  message: string
): Promise<boolean> {
  if (!NEYNAR_API_KEY) {
    console.log("Neynar API key not configured, skipping notification");
    return false;
  }

  // For now, just log the notification
  // Full implementation requires a signer UUID from Neynar
  console.log(`[Notification] FID ${recipientFid}: ${message}`);
  return true;
}

/**
 * Create a Farcaster frame notification
 * Uses the Mini App notification system
 */
export async function sendFrameNotification(
  fid: number,
  title: string,
  body: string,
  targetUrl: string
): Promise<boolean> {
  if (!NEYNAR_API_KEY) {
    console.log("Neynar API key not configured");
    return false;
  }

  try {
    // This uses Farcaster's frame notification system
    // The app must be registered as a Mini App first
    const res = await fetch(`${NEYNAR_BASE_URL}/farcaster/frame/action`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": NEYNAR_API_KEY,
      },
      body: JSON.stringify({
        type: "notification",
        target: fid,
        title,
        body,
        target_url: targetUrl,
      }),
    });

    return res.ok;
  } catch (error) {
    console.error("Frame notification error:", error);
    return false;
  }
}
