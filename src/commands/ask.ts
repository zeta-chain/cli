import axios, {
  AxiosHeaders,
  AxiosResponse,
  RawAxiosResponseHeaders,
} from "axios";
import { Command } from "commander";
import inquirer from "inquirer";
import ora from "ora";

import {
  BASE_DELAY_MS,
  DEFAULT_CHAT_API_URL,
  DEFAULT_CHATBOT_ID,
  MAX_RETRIES,
} from "../constants";

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

const jitter = (ms: number): number =>
  Math.min(60_000, ms) * (0.5 + Math.random());

type ReadableLike = {
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  setEncoding?: (enc: string) => void;
};

const isReadableLike = (value: unknown): value is ReadableLike =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { on?: unknown }).on === "function";

const readBody = async (res: AxiosResponse): Promise<string> => {
  const data = res.data as unknown;
  if (isReadableLike(data)) {
    return await new Promise<string>((resolve) => {
      let s = "";
      data.setEncoding?.("utf8");
      data.on("data", (...args: unknown[]) => {
        const c = args[0];
        s += Buffer.isBuffer(c) ? c.toString() : String(c);
      });
      data.on("end", () => resolve(s));
      data.on("error", () => resolve(""));
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
        timeout: 60_000,
        validateStatus: () => true,
      });

    let res: AxiosResponse<unknown> | null;
    try {
      res = await doFetch();
    } catch (_) {
      res = null;
    }
    let attempt = 0;
    while (attempt < MAX_RETRIES && (!res || RETRYABLE.has(res.status))) {
      const delay = jitter(BASE_DELAY_MS * Math.pow(2, attempt));
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
        const text = await readBody(res as AxiosResponse);
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
        if (parsed && typeof parsed === "object") {
          const obj = parsed as { error?: unknown; message?: unknown };
          if (typeof obj.error === "string") message = obj.error;
          else if (typeof obj.message === "string") message = obj.message;
        }
        const status = res?.status ?? 0;
        throw new Error(
          `Upstream error ${status}: ${message || res?.statusText || "Error"}`,
        );
      }
      // If no response or still not 2xx after retries
      const status = res?.status ?? 0;
      const text = res ? await readBody(res as AxiosResponse) : "";
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

    const stream = (res as AxiosResponse<unknown>).data as unknown;
    if (isReadableLike(stream)) {
      await new Promise<void>((resolve, reject) => {
        let buffer = "";
        let prebuffer = "";
        const PREBUF_LIMIT = 2048;
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
          if (json && typeof json === "object") {
            const obj = json as Record<string, unknown>;
            const maybeText = obj.text;
            if (typeof maybeText === "string") {
              textOut = maybeText;
            } else {
              const choices = (obj as { choices?: unknown }).choices;
              if (Array.isArray(choices) && choices.length > 0) {
                const first = choices[0] as unknown;
                if (first && typeof first === "object") {
                  const delta = (first as { delta?: unknown }).delta;
                  if (delta && typeof delta === "object") {
                    const content = (delta as { content?: unknown }).content;
                    if (typeof content === "string") textOut = content;
                  }
                }
              }
            }
          } else if (typeof json === "string") {
            textOut = json;
          }
          notifyFirstOutput();
          if (typeof textOut === "string") {
            process.stdout.write(textOut);
          } else if (payload && payload.trim() !== "[object Object]") {
            process.stdout.write(payload);
          }
        };

        stream.on("data", (chunk: unknown) => {
          if (sawDone) return;
          const chunkStr = Buffer.isBuffer(chunk)
            ? chunk.toString()
            : String(chunk);
          prebuffer += chunkStr;
          if (
            !sawSseData &&
            prebuffer.length < PREBUF_LIMIT &&
            !/(\r?\n|^)data:/.test(prebuffer)
          ) {
            return;
          }
          if (!sawSseData && !/(\r?\n|^)data:/.test(prebuffer)) {
            notifyFirstOutput();
            process.stdout.write(prebuffer);
            prebuffer = "";
            return;
          }

          // Switch to SSE mode
          buffer += prebuffer;
          prebuffer = "";
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
              sawSseData = true;
              const p = trimmed.slice(5).trimStart();
              eventBuf.push(p);
              continue;
            }
          }
        });
        stream.on("end", () => {
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
        stream.on("error", (err: unknown) => reject(err));
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
        const name = (err as { name?: unknown } | null | undefined)?.name;
        const message = (err as { message?: unknown } | null | undefined)
          ?.message;
        if (
          name === "ExitPromptError" ||
          (typeof message === "string" &&
            message.includes("User force closed the prompt"))
        ) {
          return;
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
    const spinner = process.stdout.isTTY
      ? ora({ text: "Thinking..." }).start()
      : null;
    const onFirstOutput = () => {
      try {
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
  .description("Send a prompt and stream the chat response")
  .argument("[prompt...]", "Prompt to send to the chatbot")
  .action(main);
