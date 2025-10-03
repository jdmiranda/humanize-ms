import _ms from 'ms';

// Pre-compiled regex for parsing time strings
const TIME_REGEX = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i;

// Time unit multipliers (pre-calculated)
const MULTIPLIERS: Record<string, number> = {
  'years': 31557600000,
  'year': 31557600000,
  'yrs': 31557600000,
  'yr': 31557600000,
  'y': 31557600000,
  'weeks': 604800000,
  'week': 604800000,
  'w': 604800000,
  'days': 86400000,
  'day': 86400000,
  'd': 86400000,
  'hours': 3600000,
  'hour': 3600000,
  'hrs': 3600000,
  'hr': 3600000,
  'h': 3600000,
  'minutes': 60000,
  'minute': 60000,
  'mins': 60000,
  'min': 60000,
  'm': 60000,
  'seconds': 1000,
  'second': 1000,
  'secs': 1000,
  'sec': 1000,
  's': 1000,
  'milliseconds': 1,
  'millisecond': 1,
  'msecs': 1,
  'msec': 1,
  'ms': 1,
};

// LRU Cache implementation
const CACHE_SIZE = 100;
const cache = new Map<string, number | undefined>();

/**
 * Fast path parser for optimized common formats
 */
function fastParse(str: string): number | undefined {
  // Fast path for common formats: "10s", "5m", "1h", "2d"
  const len = str.length;

  if (len >= 2 && len <= 10) {
    const lastChar = str[len - 1].toLowerCase();
    const numPart = str.slice(0, -1);

    // Check if it's a simple number + single char unit
    if (/^-?(?:\d+)?\.?\d+$/.test(numPart)) {
      const n = parseFloat(numPart);

      switch (lastChar) {
        case 's': return n * 1000;
        case 'm': return n * 60000;
        case 'h': return n * 3600000;
        case 'd': return n * 86400000;
        case 'w': return n * 604800000;
        case 'y': return n * 31557600000;
      }
    }
  }

  return undefined;
}

/**
 * Optimized parser with caching
 */
function parseOptimized(str: string): number | undefined {
  // Check cache first
  if (cache.has(str)) {
    return cache.get(str);
  }

  // Length check
  if (str.length > 100) {
    cache.set(str, undefined);
    return undefined;
  }

  // Try fast path first
  let result = fastParse(str);

  // Fall back to regex parsing if fast path didn't work
  if (result === undefined) {
    const match = TIME_REGEX.exec(str);
    if (!match) {
      cache.set(str, undefined);
      return undefined;
    }

    const n = parseFloat(match[1]);
    const type = (match[2] || 'ms').toLowerCase();
    result = n * (MULTIPLIERS[type] ?? 1);
  }

  // Update cache (LRU: delete oldest if cache is full)
  if (cache.size >= CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) {
      cache.delete(firstKey);
    }
  }
  cache.set(str, result);

  return result;
}

/**
 * transform humanize time to ms
 */
export function ms(t: number | string) {
  // Fast path for numbers
  if (typeof t === 'number') {
    return t;
  }

  // Use optimized parser for strings
  const r = parseOptimized(t);

  if (r === undefined) {
    const err = new TypeError(`'humanize-ms(${JSON.stringify(t)}) result undefined`);
    console.warn(err.stack);
  }
  return r;
}
