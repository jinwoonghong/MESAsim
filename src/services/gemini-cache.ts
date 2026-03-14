import type { GeminiResponse } from "@/types/gemini";

// ---------------------------------------------------------------------------
// Cache entry
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  value: GeminiResponse<T>;
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// GeminiCache - simple in-memory TTL cache
// ---------------------------------------------------------------------------

const DEFAULT_TTL_MS = 300_000; // 5 minutes
const MAX_ENTRIES = 100;

export class GeminiCache {
  private store = new Map<string, CacheEntry<unknown>>();

  /**
   * Retrieve a cached response, or null if missing / expired.
   */
  get<T>(key: string): GeminiResponse<T> | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Store a response with optional TTL (defaults to 5 minutes).
   */
  set<T>(key: string, value: GeminiResponse<T>, ttlMs: number = DEFAULT_TTL_MS): void {
    // Evict oldest entry when at capacity
    if (this.store.size >= MAX_ENTRIES && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value as string;
      this.store.delete(oldestKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Generate a deterministic cache key from type + context.
   */
  generateKey(type: string, context: Record<string, unknown>): string {
    const sorted = JSON.stringify(context, Object.keys(context).sort());
    return `${type}::${sorted}`;
  }

  /**
   * Remove all entries.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Return the number of (potentially expired) entries.
   */
  size(): number {
    return this.store.size;
  }
}

// Singleton export
export const geminiCache = new GeminiCache();
