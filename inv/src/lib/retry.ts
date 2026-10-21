/**
 * Robust, zero-dependency async retry utility with exponential backoff and jitter.
 * Safe replacement for the 'p-retry' package in both Node.js (CJS/ESM) and browser/worker environments.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 2) */
  retries?: number;
  /** Initial delay before first retry in milliseconds (default: 500) */
  minTimeout?: number;
  /** Maximum delay between retries in milliseconds (default: 5000) */
  maxTimeout?: number;
  /** Multiplicative factor for exponential backoff (default: 2) */
  factor?: number;
  /** Whether to add random jitter (±20%) to backoff delays (default: true) */
  randomize?: boolean;
  /** Optional callback invoked on each failed attempt */
  onFailedAttempt?: (error: any, attempt: number, retriesLeft: number) => void | Promise<void>;
  /** Optional AbortSignal to cancel pending retry delays */
  signal?: AbortSignal;
}

export class AbortError extends Error {
  name = 'AbortError';
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, AbortError.prototype);
  }
}

/**
 * Executes an asynchronous function with exponential backoff retry logic.
 *
 * @param fn Asynchronous function to execute
 * @param options Configuration options for retries, backoff, and timeouts
 * @returns Resolves with the result of `fn`
 */
export async function pRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retries = options.retries ?? 2;
  const minTimeout = Math.max(0, options.minTimeout ?? 500);
  const maxTimeout = Math.max(minTimeout, options.maxTimeout ?? 5000);
  const factor = Math.max(1, options.factor ?? 2);
  const randomize = options.randomize ?? true;
  const signal = options.signal;

  let lastError: any;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    if (signal?.aborted) {
      throw new AbortError('Retry aborted by signal');
    }

    try {
      return await fn(attempt);
    } catch (err: any) {
      lastError = err;

      // If this is an explicit abort error, do not retry
      if (err instanceof AbortError || err?.name === 'AbortError') {
        throw err;
      }

      const retriesLeft = retries + 1 - attempt;
      if (retriesLeft <= 0) {
        break;
      }

      if (options.onFailedAttempt) {
        try {
          await options.onFailedAttempt(err, attempt, retriesLeft);
        } catch (callbackErr) {
          // Swallow or log callback errors to prevent disrupting retry flow
          console.warn('[retry] onFailedAttempt callback error:', callbackErr);
        }
      }

      // Calculate exponential backoff delay: minTimeout * (factor ^ (attempt - 1))
      let delay = minTimeout * Math.pow(factor, attempt - 1);
      if (randomize) {
        // Apply jitter between 0.8x and 1.2x of calculated delay
        const jitter = 0.8 + Math.random() * 0.4;
        delay = Math.round(delay * jitter);
      }
      delay = Math.min(delay, maxTimeout);

      await new Promise<void>((resolve, reject) => {
        if (signal?.aborted) {
          return reject(new AbortError('Retry aborted by signal'));
        }

        const timer = setTimeout(() => {
          if (signal) {
            signal.removeEventListener('abort', onAbort);
          }
          resolve();
        }, delay);

        const onAbort = () => {
          clearTimeout(timer);
          reject(new AbortError('Retry aborted by signal'));
        };

        if (signal) {
          signal.addEventListener('abort', onAbort, { once: true });
        }
      });
    }
  }

  throw lastError;
}

export default pRetry;
