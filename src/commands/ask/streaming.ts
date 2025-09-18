import { RateLimiter } from "../../utils/rate-limit";
import { isValidStream } from "../../utils/stream";
import { fetchChatStream, validateChatResponse } from "./http";
import { createSSEProcessor, processStream } from "./sse";

// Ask command specific streaming orchestration

const rateLimiter = new RateLimiter(10, 60 * 1000); // 10 requests per minute

export const streamChatResponse = async (
  url: string,
  body: unknown,
  onFirstOutput?: () => void,
  onTextChunk?: (text: string) => void,
): Promise<void> => {
  const controller = new AbortController();
  const onSigint = (): void => controller.abort();
  const onSigterm = (): void => controller.abort();
  process.on("SIGINT", onSigint);
  process.on("SIGTERM", onSigterm);

  try {
    // 1. Check rate limit
    rateLimiter.check();

    // 2. Fetch with retry logic
    const res = await fetchChatStream(url, body, controller.signal);

    // 3. Validate response
    await validateChatResponse(res);

    // 4. Process stream if valid
    const stream = res.data as unknown;
    if (!isValidStream(stream)) {
      throw new Error("Response is not a valid stream");
    }

    // 5. Create SSE processor and handle stream
    const processor = createSSEProcessor(
      onFirstOutput || (() => {}),
      onTextChunk,
    );
    await processStream(stream, processor);
  } finally {
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
  }
};
