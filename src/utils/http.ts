import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

// Highly reusable HTTP utilities for any CLI command

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

export const jitter = (ms: number): number =>
  Math.min(60_000, ms) * (0.5 + Math.random());

export interface RetryConfig {
  baseDelay: number;
  maxRetries: number;
  retryableStatuses?: Set<number>;
}

export const fetchWithRetry = async (
  url: string,
  config: AxiosRequestConfig,
  retryConfig: RetryConfig,
): Promise<AxiosResponse> => {
  const {
    maxRetries,
    baseDelay,
    retryableStatuses = RETRYABLE_STATUS_CODES,
  } = retryConfig;

  let res: AxiosResponse | null = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      res = await axios(url, { ...config, validateStatus: () => true });

      // If successful or non-retryable status, break
      if (res && res.status >= 200 && res.status < 300) {
        break;
      }
      if (res && !retryableStatuses.has(res.status)) {
        break;
      }
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
    }

    if (attempt < maxRetries) {
      const delay = jitter(baseDelay * Math.pow(2, attempt));
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    attempt++;
  }

  if (!res) {
    throw new Error("Failed to get response after retries");
  }

  return res;
};

export const isRetryableError = (statusCode: number): boolean => {
  return RETRYABLE_STATUS_CODES.has(statusCode);
};
