import { Command } from "commander";
import inquirer from "inquirer";

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
  const { default: fetch } = await import("node-fetch");

  const doFetch = async () =>
    fetch(url, {
      body: JSON.stringify(body),
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      method: "POST",
    });

  let res = await doFetch().catch(() => null as any);
  let attempt = 0;
  while (
    (!res || !res.ok) &&
    attempt < maxRetries &&
    (res == null || [429, 500, 502, 503, 504].includes(res.status))
  ) {
    const delay = baseDelayMs * Math.pow(2, attempt);
    await new Promise((r) => setTimeout(r, delay));
    res = await doFetch().catch(() => null as any);
    attempt++;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const isJson = res.headers
      .get("content-type")
      ?.includes("application/json");
    const payload = isJson ? safeParseJson(text) : text;
    const message =
      (payload as any)?.error || (payload as any)?.message || res.statusText;
    throw new Error(`Upstream error ${res.status}: ${message}`);
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

  const reader = (res.body as any).getReader?.();
  if (reader && typeof reader.read === "function") {
    const decoder = new TextDecoder();
    let buffer = "";
    let sawSseData = false;
    let done = false;
    while (!done) {
      const { value, done: isDone } = await reader.read();
      done = isDone;
      if (value) {
        const chunkStr = decoder.decode(value, { stream: true });
        const candidate = buffer + chunkStr;
        if (!sawSseData && !candidate.includes("data:")) {
          notifyFirstOutput();
          process.stdout.write(chunkStr);
          continue;
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
          const json = safeParseJson(payload) as any;
          let text: string | null = null;
          if (json && typeof json === "object") {
            if (typeof json.text === "string") text = json.text;
            else if (typeof json.choices?.[0]?.delta?.content === "string")
              text = json.choices[0].delta.content;
          } else if (typeof json === "string") {
            text = json;
          }
          if (typeof text === "string") {
            notifyFirstOutput();
            process.stdout.write(text);
            continue;
          }
          if (payload.trim() !== "[object Object]") {
            notifyFirstOutput();
            process.stdout.write(payload);
          }
        }
      }
    }
    if (buffer) {
      const trimmed = buffer.trimStart();
      if (!trimmed.startsWith("data:")) {
        notifyFirstOutput();
        process.stdout.write(buffer);
      } else if (trimmed.startsWith("data:")) {
        const payload = trimmed.slice(5).trimStart();
        if (payload && payload !== "[DONE]") {
          const json = safeParseJson(payload) as any;
          if (
            json &&
            typeof json === "object" &&
            typeof json.text === "string"
          ) {
            notifyFirstOutput();
            process.stdout.write(String(json.text));
          } else if (payload.trim() !== "[object Object]") {
            notifyFirstOutput();
            process.stdout.write(payload);
          }
        }
      }
    }
    process.stdout.write("\n");
    return;
  }

  const anyBody: any = res.body as any;
  if (anyBody && typeof anyBody.on === "function") {
    await new Promise<void>((resolve, reject) => {
      let buffer = "";
      let sawSseData = false;
      anyBody.on("data", (chunk: Buffer) => {
        const chunkStr = chunk.toString();
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
          const json = safeParseJson(payload) as any;
          let text: string | null = null;
          if (json && typeof json === "object") {
            if (typeof json.text === "string") text = json.text;
            else if (typeof json.choices?.[0]?.delta?.content === "string")
              text = json.choices[0].delta.content;
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
      anyBody.on("end", () => {
        if (buffer) {
          const trimmed = buffer.trimStart();
          if (!trimmed.startsWith("data:")) {
            notifyFirstOutput();
            process.stdout.write(buffer);
          } else if (trimmed.startsWith("data:")) {
            const payload = trimmed.slice(5).trimStart();
            if (payload && payload !== "[DONE]") {
              const json = safeParseJson(payload) as any;
              if (
                json &&
                typeof json === "object" &&
                typeof json.text === "string"
              ) {
                notifyFirstOutput();
                process.stdout.write(String(json.text));
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
      anyBody.on("error", (err: unknown) => reject(err));
    });
    return;
  }
};

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

function startSpinner(text: string): () => void {
  if (!process.stdout.isTTY) return () => undefined;
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const interval = setInterval(() => {
    try {
      process.stdout.write(`\r${frames[i % frames.length]} ${text}`);
      i++;
    } catch (_) {
      // ignore write errors
    }
  }, 80);
  return () => {
    clearInterval(interval);
    try {
      if (typeof (process.stdout as any).clearLine === "function") {
        (process.stdout as any).clearLine(0);
      }
      if (typeof (process.stdout as any).cursorTo === "function") {
        (process.stdout as any).cursorTo(0);
      } else {
        process.stdout.write("\r");
      }
    } catch (_) {
      // ignore clear errors
    }
  };
}

async function promptOnce(): Promise<string> {
  const { input } = await inquirer.prompt([
    {
      type: "input",
      name: "input",
      message: "Ask ZetaChain",
    },
  ]);
  return String(input ?? "").trim();
}

const interactive = async (initialPrompt?: string): Promise<void> => {
  let next = initialPrompt?.trim();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (!next) {
      next = await promptOnce();
    }
    const lower = next.toLowerCase();
    if (!next || lower === "exit" || lower === "quit" || lower === ":q") {
      break;
    }

    const messages: ChatbaseMessage[] = [{ content: next, role: "user" }];
    const payload = {
      chatbotId: DEFAULT_CHATBOT_ID,
      messages,
      stream: true,
    };

    const stop = startSpinner("Thinking...");
    try {
      await streamSSE(DEFAULT_CHAT_API_URL, payload, stop);
    } catch (err) {
      stop();
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Chat error: ${message}`);
      process.exitCode = 1;
    }

    next = ""; // force prompt again
  }
};

const main = async (promptParts: string[]): Promise<void> => {
  const initial = promptParts.join(" ").trim();
  await interactive(initial || undefined);
};

export const chatCommand = new Command("chat")
  .description("Send a prompt and stream the chat response")
  .argument("[prompt...]", "Prompt to send to the chatbot")
  .action((...args: any[]) => {
    const promptParts = args.slice(0, -1);
    return main(promptParts);
  });
