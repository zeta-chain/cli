import axios, {
  AxiosHeaders,
  AxiosResponse,
  RawAxiosResponseHeaders,
} from "axios";
import { Command } from "commander";
import inquirer from "inquirer";
import ora from "ora";

const DEFAULT_CHAT_API_URL =
  "https://docs-v2-git-chat-api.zetachain.app/api/chat/";
const DEFAULT_CHATBOT_ID = process.env.CHATBOT_ID || "HwoQ2Sf9rFFtdW59sbYKF";
const maxRetries = 5;
const baseDelayMs = 10000;

const streamSSE = async (
  url: string,
  body: unknown,
  onFirstOutput?: () => void
): Promise<void> => {
  const doFetch = async (): Promise<AxiosResponse<unknown>> =>
    axios.post(url, body, {
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      responseType: "stream",
      // We'll handle non-2xx manually
      validateStatus: () => true,
    });

  let res: AxiosResponse<unknown> | null;
  try {
    res = await doFetch();
  } catch (_) {
    res = null;
  }
  let attempt = 0;
  while (
    (!res || !(res.status >= 200 && res.status < 300)) &&
    attempt < maxRetries &&
    (res == null || [429, 500, 502, 503, 504].includes(res.status))
  ) {
    const delay = baseDelayMs * Math.pow(2, attempt);
    await new Promise((r) => setTimeout(r, delay));
    try {
      res = await doFetch();
    } catch (_) {
      res = null;
    }
    attempt++;
  }

  if (!res || !(res.status >= 200 && res.status < 300)) {
    let text = "";
    try {
      if (res && (res.data == null || typeof res.data !== "object")) {
        text = String(res.data ?? "");
      }
    } catch (_) {
      text = "";
    }
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
      `Upstream error ${status}: ${message || res?.statusText || "Error"}`
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

  const stream: any = (res as AxiosResponse<unknown>).data as any;
  if (stream && typeof stream.on === "function") {
    await new Promise<void>((resolve, reject) => {
      let buffer = "";
      let sawSseData = false;
      stream.on("data", (chunk: unknown) => {
        const chunkStr = Buffer.isBuffer(chunk)
          ? chunk.toString()
          : String(chunk);
        const candidate = buffer + chunkStr;
        if (!sawSseData && !candidate.includes("data:")) {
          notifyFirstOutput();
          process.stdout.write(chunkStr);
          return;
        }
        buffer += chunkStr;
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trimStart();
          if (!trimmed) continue;
          if (trimmed.startsWith(":")) continue;
          if (trimmed.startsWith("event:")) continue;
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trimStart();
          if (!payload) continue;
          if (payload === "[DONE]") continue;
          sawSseData = true;
          let json: unknown = null;
          try {
            json = JSON.parse(payload);
          } catch (_) {
            json = null;
          }
          let text: string | null = null;
          if (json && typeof json === "object") {
            const obj = json as Record<string, unknown>;
            const maybeText = obj.text;
            if (typeof maybeText === "string") {
              text = maybeText;
            } else {
              const choices = (obj as { choices?: unknown }).choices;
              if (Array.isArray(choices) && choices.length > 0) {
                const first = choices[0] as unknown;
                if (first && typeof first === "object") {
                  const delta = (first as { delta?: unknown }).delta;
                  if (delta && typeof delta === "object") {
                    const content = (delta as { content?: unknown }).content;
                    if (typeof content === "string") text = content;
                  }
                }
              }
            }
          } else if (typeof json === "string") {
            text = json;
          }
          if (typeof text === "string") {
            notifyFirstOutput();
            process.stdout.write(text);
          } else if (payload && payload.trim() !== "[object Object]") {
            notifyFirstOutput();
            process.stdout.write(payload);
          }
        }
      });
      stream.on("end", () => {
        if (buffer) {
          const trimmed = buffer.trimStart();
          if (!trimmed.startsWith("data:")) {
            notifyFirstOutput();
            process.stdout.write(buffer);
          } else if (trimmed.startsWith("data:")) {
            const payload = trimmed.slice(5).trimStart();
            if (payload && payload !== "[DONE]") {
              let json: unknown = null;
              try {
                json = JSON.parse(payload);
              } catch (_) {
                json = null;
              }
              if (json && typeof json === "object") {
                const obj = json as Record<string, unknown>;
                if (typeof obj.text === "string") {
                  notifyFirstOutput();
                  process.stdout.write(String(obj.text));
                } else if (payload.trim() !== "[object Object]") {
                  notifyFirstOutput();
                  process.stdout.write(payload);
                }
              } else if (payload.trim() !== "[object Object]") {
                notifyFirstOutput();
                process.stdout.write(payload);
              }
            }
          }
        }
        process.stdout.write("\n");
        resolve();
      });
      stream.on("error", (err: unknown) => reject(err));
    });
    return;
  }
};

const main = async (promptParts: string[]): Promise<void> => {
  let nextPrompt = promptParts.join(" ").trim();
  for (;;) {
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
