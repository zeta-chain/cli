import axios, {
  AxiosHeaders,
  AxiosResponse,
  RawAxiosResponseHeaders,
} from "axios";
import { Command } from "commander";
import inquirer from "inquirer";
import ora from "ora";

type ChatbaseMessage = { content: string; role: "assistant" | "user" };

const DEFAULT_CHAT_API_URL =
  "https://docs-v2-git-chat-api.zetachain.app/api/chat/";
const DEFAULT_CHATBOT_ID = process.env.CHATBOT_ID || "HwoQ2Sf9rFFtdW59sbYKF";
const maxRetries = 5;
const baseDelayMs = 10000;

type FirstOutputCallback = () => void;

const streamSSE = async (
  url: string,
  body: unknown,
  onFirstOutput?: FirstOutputCallback
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
    // Try to extract message from non-stream payloads
    let text = "";
    try {
      if (res && (res.data == null || typeof res.data !== "object")) {
        text = String(res.data ?? "");
      }
    } catch (_) {
      text = "";
    }
    const contentType = getHeaderValue(res?.headers, "content-type");
    const isJson = contentType?.includes("application/json");
    const payload = isJson ? safeParseJson(text) : text;
    const message = getPayloadMessage(payload) || res?.statusText || "Error";
    const status = res?.status ?? 0;
    throw new Error(`Upstream error ${status}: ${message}`);
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

  const bodyUnknown: unknown = (res as AxiosResponse<unknown>).data as unknown;
  if (isEventEmitterLike(bodyUnknown)) {
    await new Promise<void>((resolve, reject) => {
      let buffer = "";
      let sawSseData = false;
      bodyUnknown.on("data", (chunk: unknown) => {
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
          const json = safeParseJson(payload);
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
      bodyUnknown.on("end", () => {
        if (buffer) {
          const trimmed = buffer.trimStart();
          if (!trimmed.startsWith("data:")) {
            notifyFirstOutput();
            process.stdout.write(buffer);
          } else if (trimmed.startsWith("data:")) {
            const payload = trimmed.slice(5).trimStart();
            if (payload && payload !== "[DONE]") {
              const json = safeParseJson(payload);
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
      bodyUnknown.on("error", (err: unknown) => reject(err));
    });
    return;
  }
};

const safeParseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
};

const startSpinner = (text: string): (() => void) => {
  if (!process.stdout.isTTY) return () => undefined;
  const spinner = ora({ text }).start();
  return () => {
    try {
      spinner.stop();
    } catch (_) {
      // ignore stop errors
    }
  };
};

const promptOnce = async (): Promise<string> => {
  try {
    const { input } = await inquirer.prompt([
      {
        message: "Ask ZetaChain",
        name: "input",
        type: "input",
      },
    ]);
    return String(input ?? "").trim();
  } catch (err) {
    const { name, message } = getErrorInfo(err);
    // Suppress Ctrl+C (ExitPromptError) and exit the loop quietly
    if (
      name === "ExitPromptError" ||
      message.includes("User force closed the prompt")
    ) {
      return "";
    }
    throw err;
  }
};

const runOnce = async (
  initialPrompt?: string,
  showSpinner: boolean = true
): Promise<boolean> => {
  let prompt = initialPrompt?.trim();
  if (!prompt) {
    prompt = await promptOnce();
  }
  const lower = (prompt || "").toLowerCase();
  if (!prompt || lower === "exit" || lower === "quit" || lower === ":q") {
    return false;
  }

  const messages: ChatbaseMessage[] = [{ content: prompt, role: "user" }];
  const payload = {
    chatbotId: DEFAULT_CHATBOT_ID,
    messages,
    stream: true,
  };

  const shouldSpin =
    !!showSpinner && !!initialPrompt && initialPrompt.trim().length > 0;
  const stop = shouldSpin ? startSpinner("Thinking...") : () => undefined;
  try {
    await streamSSE(DEFAULT_CHAT_API_URL, payload, stop);
  } catch (err) {
    stop();
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Chat error: ${message}`);
    process.exitCode = 1;
  }
  return true;
};

const main = async (promptParts: string[]): Promise<void> => {
  const initial = promptParts.join(" ").trim();
  const hasArg = initial.length > 0;
  if (hasArg) {
    const shouldContinue = await runOnce(initial, /* showSpinner */ true);
    if (!shouldContinue) return;
  }
  for (;;) {
    const shouldContinue = await runOnce(undefined, /* showSpinner */ true);
    if (!shouldContinue) return;
  }
};

export const askCommand = new Command("ask")
  .description("Send a prompt and stream the chat response")
  .argument("[prompt...]", "Prompt to send to the chatbot")
  .action((promptParts: string[], _cmd: Command) => {
    return main(promptParts);
  });

// Helpers
type EventOnFn = (
  event: string,
  listener: (...args: unknown[]) => unknown
) => unknown;

const isEventEmitterLike = (body: unknown): body is { on: EventOnFn } =>
  !!body && typeof (body as { on?: unknown }).on === "function";

const getPayloadMessage = (payload: unknown): string | undefined => {
  if (payload && typeof payload === "object") {
    const obj = payload as { error?: unknown; message?: unknown };
    if (typeof obj.error === "string") return obj.error;
    if (typeof obj.message === "string") return obj.message;
  }
  return undefined;
};

const getErrorInfo = (err: unknown): { message: string; name?: string } => {
  if (err && typeof err === "object") {
    const name = (err as { name?: unknown }).name;
    const message = (err as { message?: unknown }).message;
    return {
      message: typeof message === "string" ? message : String(err),
      name: typeof name === "string" ? name : undefined,
    };
  }
  return { message: String(err), name: undefined };
};

const getHeaderValue = (
  headers: AxiosResponse["headers"] | undefined,
  key: string
): string | undefined => {
  if (!headers) return undefined;
  if (headers instanceof AxiosHeaders) {
    const v = headers.get?.(key);
    return typeof v === "string" ? v : undefined;
  }
  const raw = headers as RawAxiosResponseHeaders;
  const v = raw[key.toLowerCase()] ?? raw[key as keyof typeof raw];
  return typeof v === "string" ? v : undefined;
};
