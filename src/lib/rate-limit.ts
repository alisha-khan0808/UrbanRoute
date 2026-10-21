/**
 * Fixed-window in-memory rate limiter. Adequate for a single Node instance;
 * on multi-instance/serverless deployments swap for a shared store
 * (e.g. Upstash Redis or a Supabase table) — see README.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return {
    check(key: string, now = Date.now()): { ok: boolean; retryAfter: number } {
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        if (hits.size > 10_000) {
          for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
        }
        return { ok: true, retryAfter: 0 };
      }
      entry.count += 1;
      if (entry.count > limit) return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
      return { ok: true, retryAfter: 0 };
    },
  };
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
