// Highly reusable rate limiting for any CLI command

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private readonly limits = new Map<string, RateLimitEntry>();

  constructor(
    private readonly maxRequests: number = 10,
    private readonly windowMs: number = 60 * 1000, // 1 minute
  ) {}

  check(identifier: string = "default"): void {
    const now = Date.now();
    const userLimit = this.limits.get(identifier);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset window
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return;
    }

    if (userLimit.count >= this.maxRequests) {
      const waitTime = Math.ceil((userLimit.resetTime - now) / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds.`);
    }

    userLimit.count++;
  }

  reset(identifier?: string): void {
    if (identifier) {
      this.limits.delete(identifier);
    } else {
      this.limits.clear();
    }
  }

  getRemainingRequests(identifier: string = "default"): number {
    const userLimit = this.limits.get(identifier);
    if (!userLimit || Date.now() > userLimit.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - userLimit.count);
  }
}
