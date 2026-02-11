const store = new Map<string, { count: number; resetAt: number }>();
const MAX_HINTS = 5;
const WINDOW_MS = 86400 * 1000; // 1 day

export function checkHintRateLimit(key: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_HINTS - 1 };
  }
  if (now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_HINTS - 1 };
  }
  if (entry.count >= MAX_HINTS) {
    return { ok: false, remaining: 0 };
  }
  entry.count++;
  return { ok: true, remaining: MAX_HINTS - entry.count };
}

const submitStore = new Map<string, number>();
const SUBMIT_WINDOW_MS = 60 * 1000; // 1 per minute per key
export function checkSubmitRateLimit(key: string): boolean {
  const now = Date.now();
  const last = submitStore.get(key);
  if (!last || now - last > SUBMIT_WINDOW_MS) {
    submitStore.set(key, now);
    return true;
  }
  return false;
}
