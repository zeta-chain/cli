import { AxiosHeaders, AxiosResponse, RawAxiosResponseHeaders } from "axios";

import { ASK_BASE_DELAY_MS, ASK_MAX_RETRIES } from "../../constants";
import { fetchWithRetry } from "../../utils/http";
import { readStreamBody } from "../../utils/stream";
import { ErrorResponseSchema } from "./schemas";

// Ask command specific HTTP functionality

export const fetchChatStream = async (
  url: string,
  body: unknown,
  signal: AbortSignal,
): Promise<AxiosResponse> => {
  return fetchWithRetry(
    url,
    {
      data: body,
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      method: "POST",
      responseType: "stream",
      signal,
      timeout: 360_000,
    },
    {
      baseDelay: ASK_BASE_DELAY_MS,
      maxRetries: ASK_MAX_RETRIES,
    },
  );
};

export const parseErrorResponse = (
  res: AxiosResponse,
  text: string,
): string | undefined => {
  let contentType: string | undefined;
  if (res?.headers instanceof AxiosHeaders) {
    const v = res.headers.get?.("content-type");
    contentType = typeof v === "string" ? v : undefined;
  } else if (res?.headers) {
    const raw = res.headers as RawAxiosResponseHeaders;
    const v = raw["content-type"] ?? raw["Content-Type"];
    contentType = typeof v === "string" ? v : undefined;
  }

  const isJson = contentType?.includes("application/json");
  let parsed: unknown = text;
  if (isJson) {
    try {
      parsed = JSON.parse(text);
    } catch (_) {
      parsed = null;
    }
  }

  const errorResult = ErrorResponseSchema.safeParse(parsed);
  if (errorResult.success) {
    return errorResult.data.error || errorResult.data.message;
  }
  return undefined;
};

export const validateChatResponse = async (
  res: AxiosResponse,
): Promise<void> => {
  if (res.status >= 200 && res.status < 300) {
    return; // Success
  }

  const text = await readStreamBody(res);
  const message = parseErrorResponse(res, text);
  throw new Error(
    `Chat API error ${res.status}: ${message || res.statusText || "Error"}`,
  );
};
