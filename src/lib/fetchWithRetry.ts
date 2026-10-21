export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = 3,
  fallbackData: T
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      if (isLastAttempt) {
        console.warn(`[Network] Failed to fetch ${url} after ${retries} retries. Using fallback data.`);
        return fallbackData;
      }
      // Wait before retrying: 500ms, 1000ms, 1500ms...
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  return fallbackData;
}
