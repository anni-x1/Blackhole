type RateLimitStore = Map<string, { count: number; resetTime: number }>;

const store: RateLimitStore = new Map();

interface RateLimitConfig {
  limit: number; // Max requests
  windowMs: number; // Time window in milliseconds
}

export function rateLimit(ip: string, config: RateLimitConfig = { limit: 5, windowMs: 15 * 60 * 1000 }) {
  const now = Date.now();
  const record = store.get(ip);

  // If no record or expired, start new window
  if (!record || now > record.resetTime) {
    store.set(ip, { count: 1, resetTime: now + config.windowMs });
    return { success: true };
  }

  // Check if limit exceeded
  if (record.count >= config.limit) {
    return { success: false };
  }

  // Increment count
  record.count++;
  store.set(ip, record);
  return { success: true };
}
