/**
 * In-memory Cache Store with TTL for Serverless & API handlers
 */
const cache = new Map();

/**
 * Get cached item or execute fetcher and store result
 * @param {string} key - Cache identifier
 * @param {Function} fetcher - Async function to fetch data if cache miss
 * @param {number} ttlMs - Time to live in milliseconds
 * @returns {Promise<any>}
 */
export async function getOrCache(key, fetcher, ttlMs = 5000) {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < cached.ttl) {
    return cached.data;
  }

  try {
    const data = await fetcher();
    cache.set(key, {
      data,
      timestamp: now,
      ttl: ttlMs
    });
    return data;
  } catch (err) {
    if (cached) {
      console.warn(`[Cache] Fallback to stale data for key: ${key}`);
      return cached.data;
    }
    throw err;
  }
}

export function clearCache(key) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
