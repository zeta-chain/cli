import axios, {
  AxiosHeaders,
  AxiosResponse,
  RawAxiosResponseHeaders,
} from "axios";
import { Command } from "commander";
import inquirer from "inquirer";
import ora from "ora";
import { z } from "zod";

import {
  ASK_BASE_DELAY_MS,
  ASK_MAX_RETRIES,
  DEFAULT_CHAT_API_URL,
  DEFAULT_CHATBOT_ID,
} from "../constants";

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

const jitter = (ms: number): number =>
  Math.min(60_000, ms) * (0.5 + Math.random());

// Type for validated streams
type ValidatedStream = {
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  setEncoding?: (encoding: string) => void;
};

// Helper function to validate stream objects
const isValidStream = (value: unknown): value is ValidatedStream =>
  value !== null &&
  typeof value === "object" &&
  typeof (value as Record<string, unknown>).on === "function";

// Zod schemas for API response validation
const ErrorResponseSchema = z.object({
  error: z.string().optional(),
  message: z.string().optional(),
});

const StreamChoiceSchema = z.object({
  delta: z
    .object({
      content: z.string().optional(),
    })
    .optional(),
});

const StreamResponseSchema = z.object({
  choices: z.array(StreamChoiceSchema).optional(),
});

const TextResponseSchema = z.object({
  text: z.string(),
});

const readBody = async (res: AxiosResponse): Promise<string> => {
  const data = res.data as unknown;

  if (isValidStream(data)) {
    return await new Promise<string>((resolve) => {
      let s = "";
      const stream = data;
      stream.setEncoding?.("utf8");
      stream.on("data", (...args: unknown[]) => {
        const c = args[0];
        s += Buffer.isBuffer(c) ? c.toString() : String(c);
      });
      stream.on("end", () => resolve(s));
      stream.on("error", () => resolve(""));
    });
  }
  return typeof res.data === "string"
    ? (res.data as string)
    : res.data == null
      ? ""
      : String(res.data);
};

const streamSSE = async (
  url: string,
  body: unknown,
  onFirstOutput?: () => void,
): Promise<void> => {
  const controller = new AbortController();
  const onSigint = (): void => controller.abort();
  const onSigterm = (): void => controller.abort();
  process.on("SIGINT", onSigint);
  process.on("SIGTERM", onSigterm);

  try {
    const doFetch = async (): Promise<AxiosResponse<unknown>> =>
      axios.post(url, body, {
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
        },
        responseType: "stream",
        signal: controller.signal,
        timeout: 360_000,
        validateStatus: () => true,
      });

    let res: AxiosResponse<unknown> | null;
    try {
      res = await doFetch();
    } catch (_) {
      res = null;
    }
    let attempt = 0;
    while (attempt < ASK_MAX_RETRIES && (!res || RETRYABLE.has(res.status))) {
      const delay = jitter(ASK_BASE_DELAY_MS * Math.pow(2, attempt));
      await new Promise((r) => setTimeout(r, delay));
      try {
        res = await doFetch();
      } catch (_) {
        res = null;
      }
      attempt++;
    }

    if (!res || !(res.status >= 200 && res.status < 300)) {
      // Fail fast on non-retryable 4xx
      if (
        res &&
        !RETRYABLE.has(res.status) &&
        (res.status < 200 || res.status >= 300)
      ) {
        if (!res) throw new Error("No response received");
        const text = await readBody(res);
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
        let message: string | undefined;
        const errorResult = ErrorResponseSchema.safeParse(parsed);
        if (errorResult.success) {
          message = errorResult.data.error || errorResult.data.message;
        }
        const status = res?.status ?? 0;
        throw new Error(
          `Upstream error ${status}: ${message || res?.statusText || "Error"}`,
        );
      }
      // If no response or still not 2xx after retries
      const status = res?.status ?? 0;
      const text = res ? await readBody(res) : "";
      throw new Error(
        `Upstream error ${status}: ${text || res?.statusText || "Error"}`,
      );
    }

    let notifiedFirstOutput = false;
    const notifyFirstOutput = () => {
      if (notifiedFirstOutput) return;
      notifiedFirstOutput = true;
      try {
        onFirstOutput?.();
      } catch (_) {
        // ignore callback errors
      }
    };

    if (!res) throw new Error("No response received for streaming");
    const stream = res.data as unknown;

    if (isValidStream(stream)) {
      const validStream = stream;
      await new Promise<void>((resolve, reject) => {
        let buffer = "";
        let prebuffer = "";
        let sawSseData = false;
        let eventBuf: string[] = [];
        let sawDone = false;

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
            process.stdout.write(textOut);
          } else if (payload && payload.trim() !== "[object Object]") {
            process.stdout.write(payload);
          }
        };

        // validStream is already defined above
        validStream.on("data", (chunk: unknown) => {
          if (sawDone) return;
          const chunkStr = Buffer.isBuffer(chunk)
            ? chunk.toString()
            : String(chunk);

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
        });
        validStream.on("end", () => {
          if (!sawSseData && prebuffer) {
            notifyFirstOutput();
            process.stdout.write(prebuffer);
            prebuffer = "";
          }
          if (buffer) {
            const trimmed = buffer.trimStart();
            if (!sawSseData || !/(\r?\n|^)data:/.test(trimmed)) {
              notifyFirstOutput();
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
          resolve();
        });
        validStream.on("error", (err: unknown) => reject(err));
      });
      return;
    }
  } finally {
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
  }
};

const main = async (promptParts: string[]): Promise<void> => {
  let nextPrompt = promptParts.join(" ").trim();
  while (true) {
    let prompt = nextPrompt;
    if (!prompt) {
      try {
        const { input } = await inquirer.prompt([
          { message: "Ask ZetaChain", name: "input", type: "input" },
        ]);
        prompt = String(input ?? "").trim();
      } catch (err) {
        // Handle inquirer exit scenarios
        if (err instanceof Error) {
          if (
            err.name === "ExitPromptError" ||
            err.message.includes("User force closed the prompt")
          ) {
            return;
          }
        }
        throw err;
      }
    }
    const lower = (prompt || "").toLowerCase();
    if (!prompt || lower === "exit" || lower === "quit" || lower === ":q") {
      return;
    }
    const payload = {
      chatbotId: DEFAULT_CHATBOT_ID,
      messages: [{ content: prompt, role: "user" }],
      stream: true,
    };
    const phrases = [
      "Untangling cosmic blockchains",
      "Consulting the oracle logs",
      "Herding universal contracts",
      "Tickling the Gateway gremlins",
      "Peering into quantum mempools",
      "Polishing chain abstractions",
      "Chasing runaway transactions",
      "Listening to validator whispers",
      "Feeding gas to the EVM dragons",
      "Baking fresh consensus pies",
      "Watering cross-chain bridges",
      "Teaching tokens new tricks",
      "Collecting stray opcodes",
      "Aligning interchain stars",
      "Summoning a clean response",
    ];
    const pickNextIndex = (prev: number, size: number): number => {
      if (size <= 1) return prev;
      let n = Math.floor(Math.random() * size);
      if (n === prev) n = (n + 1) % size;
      return n;
    };
    let phraseIndex = Math.floor(Math.random() * phrases.length);
    const spinner = process.stdout.isTTY
      ? ora({ text: `${phrases[phraseIndex]}...` }).start()
      : null;
    let spinnerInterval: NodeJS.Timeout | null = null;
    if (spinner) {
      spinnerInterval = setInterval(() => {
        phraseIndex = pickNextIndex(phraseIndex, phrases.length);
        spinner.text = `${phrases[phraseIndex]}...`;
      }, 4000);
    }
    const onFirstOutput = () => {
      try {
        if (spinnerInterval) {
          clearInterval(spinnerInterval);
          spinnerInterval = null;
        }
        spinner?.stop();
      } catch (_) {}
    };
    try {
      await streamSSE(DEFAULT_CHAT_API_URL, payload, onFirstOutput);
    } catch (err) {
      onFirstOutput();
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Chat error: ${message}`);
      process.exitCode = 1;
    }
    nextPrompt = "";
  }
};

export const askCommand = new Command("ask")
  .description("Chat with ZetaChain Docs AI")
  .argument("[prompt...]", "Prompt to send to AI")
  .action(main);
