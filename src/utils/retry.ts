/**
 * @file retry.ts
 * @description Utility functions for retrying failed operations.
 *
 * Provides:
 * - Exponential backoff retry logic
 * - Rate limit handling
 * - Configurable retry options
 */

export type RetryOptions = {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Callback called before each retry */
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
};

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  isRetryable: () => true,
  onRetry: () => {},
};

/**
 * Check if an error is a rate limit error (HTTP 429)
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("429") || error.message.toLowerCase().includes("rate limit");
  }
  return false;
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return true;
  }
  if (error instanceof Error) {
    return error.message.toLowerCase().includes("network") ||
           error.message.toLowerCase().includes("timeout") ||
           error.message.toLowerCase().includes("connection");
  }
  return false;
}

/**
 * Default function to determine if an error is retryable
 */
export function defaultIsRetryable(error: unknown): boolean {
  // Retry on network errors
  if (isNetworkError(error)) return true;

  // Retry on rate limit errors
  if (isRateLimitError(error)) return true;

  // Retry on server errors (5xx)
  if (error instanceof Error) {
    const statusMatch = error.message.match(/\b5\d{2}\b/);
    if (statusMatch) return true;
  }

  // Don't retry on client errors (4xx except 429)
  if (error instanceof Error) {
    const statusMatch = error.message.match(/\b4\d{2}\b/);
    if (statusMatch && !error.message.includes("429")) return false;
  }

  return false;
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt - 1);
  // Add jitter (±10%) to prevent thundering herd
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  return Math.min(delay + jitter, maxDelay);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 *
 * @param fn - The async function to execute
 * @param options - Retry options
 * @returns The result of the function
 * @throws The last error if all retries fail
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => fetch('/api/data'),
 *   {
 *     maxAttempts: 3,
 *     isRetryable: defaultIsRetryable,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms`);
 *     }
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const isLastAttempt = attempt === opts.maxAttempts;
      const shouldRetry = !isLastAttempt && opts.isRetryable(error);

      if (!shouldRetry) {
        throw error;
      }

      // Calculate delay
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      // Notify of retry
      opts.onRetry(attempt, error, delay);

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Create a retryable version of an async function
 *
 * @param fn - The async function to wrap
 * @param options - Retry options
 * @returns A wrapped function with retry logic
 */
export function makeRetryable<Args extends unknown[], Return>(
  fn: (...args: Args) => Promise<Return>,
  options: RetryOptions = {}
): (...args: Args) => Promise<Return> {
  return (...args: Args) => withRetry(() => fn(...args), options);
}
