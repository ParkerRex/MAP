import type { GaxiosError } from "gaxios";
import { INITIAL_RETRY_DELAY_MS, MAX_RETRIES } from "@/lib/constants";

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is a rate limit error (HTTP 429)
 */
export function isRateLimitError(error: unknown): boolean {
  const gaxiosError = error as GaxiosError;
  return gaxiosError?.response?.status === 429;
}

/**
 * Get retry delay from Retry-After header or use exponential backoff
 */
export function getRetryDelay(error: unknown, attempt: number): number {
  const gaxiosError = error as GaxiosError;
  const retryAfter = gaxiosError?.response?.headers?.["retry-after"];
  if (retryAfter) {
    // Retry-After can be seconds or a date
    const seconds = Number.parseInt(retryAfter, 10);
    if (!Number.isNaN(seconds)) {
      return seconds * 1000;
    }
  }
  // Exponential backoff: 1s, 2s, 4s, 8s...
  return INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1);
}

/**
 * Retry wrapper for API calls with rate limit handling
 *
 * @param fn - The async function to retry
 * @param context - A description of the operation for logging
 * @returns The result of the function
 */
export async function withRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      return await fn();
    } catch (error) {
      if (isRateLimitError(error)) {
        const delay = getRetryDelay(error, attempt);
        console.log(
          `Rate limited on ${context}, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`,
        );
        await sleep(delay);
        continue;
      }
      if (attempt >= MAX_RETRIES) {
        throw error;
      }
      await sleep(INITIAL_RETRY_DELAY_MS * attempt);
    }
  }
  throw new Error(`Max retries exceeded for ${context}`);
}
