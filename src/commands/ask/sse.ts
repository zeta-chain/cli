import { StreamLike } from "../../utils/stream";
import { StreamResponseSchema, TextResponseSchema } from "./schemas";

// Ask command specific SSE processing (could be reusable for other SSE APIs)

export interface SSEProcessor {
  onData: (chunk: unknown) => void;
  onEnd: () => void;
  onError: (err: unknown) => void;
}

export const createSSEProcessor = (
  onFirstOutput: () => void,
  onTextChunk?: (text: string) => void
): SSEProcessor => {
  let buffer = "";
  let prebuffer = "";
  let sawSseData = false;
  let eventBuf: string[] = [];
  let sawDone = false;
  let notifiedFirstOutput = false;

  const notifyFirstOutput = () => {
    if (notifiedFirstOutput) return;
    notifiedFirstOutput = true;
    try {
      onFirstOutput();
    } catch (_) {
      // ignore callback errors
    }
  };

  const flushEvent = () => {
    if (!eventBuf.length) return;
    const payload = eventBuf.join("\n");
    eventBuf = [];

    if (payload === "[DONE]") {
      sawDone = true;
      return;
    }

    let json: unknown = null;
    try {
      json = JSON.parse(payload);
    } catch (_) {
      json = null;
    }

    let textOut: string | null = null;

    // Try parsing as text response first
    const textResult = TextResponseSchema.safeParse(json);
    if (textResult.success) {
      textOut = textResult.data.text;
    } else {
      // Try parsing as stream response
      const streamResult = StreamResponseSchema.safeParse(json);
      if (
        streamResult.success &&
        streamResult.data.choices?.[0]?.delta?.content
      ) {
        textOut = streamResult.data.choices[0].delta.content;
      } else if (typeof json === "string") {
        textOut = json;
      }
    }

    notifyFirstOutput();
    if (typeof textOut === "string") {
      if (onTextChunk) onTextChunk(textOut);
      process.stdout.write(textOut);
    } else if (payload && payload.trim() !== "[object Object]") {
      if (onTextChunk) onTextChunk(payload);
      process.stdout.write(payload);
    }
  };

  const onData = (chunk: unknown) => {
    if (sawDone) return;

    const chunkStr = Buffer.isBuffer(chunk) ? chunk.toString() : String(chunk);

    // Stream raw text immediately until we detect SSE lines (data: ...)
    if (!sawSseData) {
      const combined = prebuffer + chunkStr;
      if (/(\r?\n|^)data:/.test(combined)) {
        // Detected SSE, switch to SSE parsing mode
        sawSseData = true;
        buffer += combined;
        prebuffer = "";
      } else {
        prebuffer = "";
        notifyFirstOutput();
        if (onTextChunk) onTextChunk(chunkStr);
        process.stdout.write(chunkStr);
        return;
      }
    } else {
      buffer += chunkStr;
    }

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trimStart();
      if (trimmed === "") {
        flushEvent();
        continue;
      }
      if (trimmed.startsWith(":")) continue; // comment
      if (trimmed.startsWith("event:")) continue; // ignore event name
      if (trimmed.startsWith("data:")) {
        const p = trimmed.slice(5).trimStart();
        eventBuf.push(p);
        continue;
      }
    }
  };

  const onEnd = () => {
    if (!sawSseData && prebuffer) {
      notifyFirstOutput();
      if (onTextChunk) onTextChunk(prebuffer);
      process.stdout.write(prebuffer);
      prebuffer = "";
    }

    if (buffer) {
      const trimmed = buffer.trimStart();
      if (!sawSseData || !/(\r?\n|^)data:/.test(trimmed)) {
        notifyFirstOutput();
        if (onTextChunk) onTextChunk(buffer);
        process.stdout.write(buffer);
      } else {
        // finalize any pending event
        if (trimmed) {
          const maybe = trimmed.startsWith("data:")
            ? trimmed.slice(5).trimStart()
            : trimmed;
          if (maybe) {
            eventBuf.push(maybe);
          }
        }
        flushEvent();
      }
    }

    process.stdout.write("\n");
  };

  const onError = (err: unknown) => {
    throw err;
  };

  return { onData, onEnd, onError };
};

export const processStream = async (
  stream: StreamLike,
  processor: SSEProcessor
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    stream.on("data", processor.onData);
    stream.on("end", () => {
      processor.onEnd();
      resolve();
    });
    stream.on("error", (err: unknown) => {
      try {
        processor.onError(err);
      } catch (processedError) {
        reject(processedError);
      }
    });
  });
};
