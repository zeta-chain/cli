import { Command } from "commander";

type ChatbaseMessage = { content: string; role: "assistant" | "user" };

const DEFAULT_CHAT_API_URL =
  process.env.CHAT_API_URL ||
  "https://docs-v2-git-chat-api.zetachain.app/api/chat/";
const DEFAULT_CHATBOT_ID = process.env.CHATBOT_ID || "HwoQ2Sf9rFFtdW59sbYKF";

const streamSSE = async (url: string, body: unknown): Promise<void> => {
  const DEBUG = Boolean(process.env.DEBUG);
  const { default: fetch } = await import("node-fetch");
  const maxRetries = Number(process.env.CHAT_RETRIES ?? 2);
  const baseDelayMs = Number(process.env.CHAT_RETRY_DELAY_MS ?? 750);

  const doFetch = async () =>
    fetch(url, {
      body: JSON.stringify(body),
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      method: "POST",
    });

  let res = await doFetch().catch((err: unknown) => {
    if (DEBUG) console.error(`[chat] initial fetch error: ${String(err)}`);
    return null as any;
  });
  let attempt = 0;
  while (
    (!res || !res.ok) &&
    attempt < maxRetries &&
    (res == null || [429, 500, 502, 503, 504].includes(res.status))
  ) {
    const delay = baseDelayMs * Math.pow(2, attempt);
    if (DEBUG)
      console.error(
        `[chat] retrying attempt=${attempt + 1} status=${res?.status ?? "network"} delayMs=${delay}`
      );
    await new Promise((r) => setTimeout(r, delay));
    res = await doFetch().catch((err: unknown) => {
      if (DEBUG) console.error(`[chat] fetch error on retry: ${String(err)}`);
      return null as any;
    });
    attempt++;
  }

  // If non-OK, try to read body and surface error
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

  const contentType = res.headers.get("content-type") || "";
  const isEventStream = contentType.includes("text/event-stream");
  if (DEBUG) {
    console.error(`[chat] status=${res.status} content-type=${contentType}`);
  }

  // If clearly JSON, just print JSON/text and exit
  if (
    (contentType.includes("application/json") && !isEventStream) ||
    !res.body
  ) {
    const text = await res.text();
    const data = safeParseJson(text);
    if (data && typeof data === "object" && "text" in data) {
      process.stdout.write(String((data as any).text) + "\n");
    } else {
      process.stdout.write(
        (data ? JSON.stringify(data, null, 2) : text) + "\n"
      );
    }
    return;
  }

  // Stream using Web Streams API and decode SSE frames
  const reader = (res.body as any).getReader?.();
  if (reader && typeof reader.read === "function") {
    const decoder = new TextDecoder();
    let buffer = "";
    let emitted = false;
    let sawSseData = false;
    let done = false;
    while (!done) {
      const { value, done: isDone } = await reader.read();
      done = isDone;
      if (value) {
        const chunkStr = decoder.decode(value, { stream: true });
        if (DEBUG) {
          try {
            const len = Buffer.from(value).length;
            console.error(`[chat] chunk=${len}b`);
          } catch {}
        }
        // If we haven't detected SSE yet and there is no SSE marker, stream raw
        if (!sawSseData) {
          const candidate = buffer + chunkStr;
          if (!candidate.includes("data:")) {
            process.stdout.write(chunkStr);
            emitted = true;
            continue;
          }
        }
        buffer += chunkStr;

        // Process complete lines
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? ""; // keep the trailing partial line

        for (const line of lines) {
          if (DEBUG) console.error(`[chat] line=${JSON.stringify(line)}`);
          const trimmed = line.trimStart();
          if (!trimmed) continue; // skip empty keep-alives
          if (trimmed.startsWith(":")) continue; // comment
          if (trimmed.startsWith("event:")) continue;
          if (!trimmed.startsWith("data:")) continue;

          const payload = trimmed.slice(5).trimStart();
          if (!payload) continue;
          if (payload === "[DONE]") continue;
          sawSseData = true;

          const json = safeParseJson(payload);
          const text = extractText(json);
          if (typeof text === "string") {
            process.stdout.write(text);
            emitted = true;
            if (DEBUG) console.error(`[chat] text=${JSON.stringify(text)}`);
            continue;
          }
          if (payload.trim() !== "[object Object]") {
            process.stdout.write(payload);
          }
          emitted = true;
          if (DEBUG) console.error(`[chat] payload=${JSON.stringify(payload)}`);
        }
      }
    }
    // Flush remaining buffer if it contains a last complete payload
    if (buffer.trim()) {
      const trimmed = buffer.trimStart();
      if (trimmed.startsWith("data:")) {
        const payload = trimmed.slice(5).trimStart();
        const json = safeParseJson(payload);
        if (
          json &&
          typeof json === "object" &&
          typeof (json as any).text === "string"
        ) {
          process.stdout.write(String((json as any).text));
          emitted = true;
        } else if (payload) {
          process.stdout.write(payload);
          emitted = true;
        }
      } else if (!emitted) {
        // As a last resort, print whatever buffered data remains
        process.stdout.write(buffer);
        emitted = true;
      }
    }
    process.stdout.write("\n");
    return;
  }

  // Fallback: try piping as Node stream (older node-fetch/polyfills)
  const anyBody: any = res.body as any;
  if (anyBody && typeof anyBody.on === "function") {
    await new Promise<void>((resolve, reject) => {
      let buffer = "";
      let emitted = false;
      let sawSseData = false;
      anyBody.on("data", (chunk: Buffer) => {
        if (DEBUG) console.error(`[chat] chunk=${chunk.length}b`);
        const chunkStr = chunk.toString();
        if (!sawSseData) {
          const candidate = buffer + chunkStr;
          if (!candidate.includes("data:")) {
            process.stdout.write(chunkStr);
            emitted = true;
            return;
          }
        }
        buffer += chunkStr;
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (DEBUG) console.error(`[chat] line=${JSON.stringify(line)}`);
          const trimmed = line.trimStart();
          if (!trimmed) continue;
          if (trimmed.startsWith(":")) continue;
          if (trimmed.startsWith("event:")) continue;
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trimStart();
          sawSseData = true;
          const json = safeParseJson(payload);
          const text = extractText(json);
          if (typeof text === "string") {
            process.stdout.write(text);
            emitted = true;
          } else if (payload && payload.trim() !== "[object Object]") {
            process.stdout.write(payload);
            emitted = true;
          }
        }
      });
      anyBody.on("end", () => {
        if (!emitted && buffer) {
          process.stdout.write(buffer);
          emitted = true;
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

function extractText(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return null;
  const v = value as any;
  if (typeof v.text === "string") return v.text;
  if (typeof v.answer === "string") return v.answer;
  if (typeof v.message === "string") return v.message;
  if (typeof v.data === "string") return v.data;
  const choice = v.choices?.[0];
  if (choice && typeof choice.delta?.content === "string")
    return choice.delta.content;
  if (choice && typeof choice.text === "string") return choice.text;
  return null;
}

const main = async (promptParts: string[]): Promise<void> => {
  const prompt = promptParts.join(" ").trim();
  if (!prompt) {
    console.error("Please provide a prompt to send.");
    process.exitCode = 1;
    return;
  }

  const messages: ChatbaseMessage[] = [{ content: prompt, role: "user" }];

  const payload = {
    chatbotId: DEFAULT_CHATBOT_ID,
    messages,
    stream: true,
  };

  try {
    await streamSSE(DEFAULT_CHAT_API_URL, payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Chat error: ${message}`);
    process.exitCode = 1;
  }
};

export const chatCommand = new Command("chat")
  .description("Send a prompt and stream the chat response")
  .argument("<prompt...>", "Prompt to send to the chatbot")
  .action((...args: any[]) => {
    // Commander passes args then command; extract prompt parts
    const command = args[args.length - 1];
    const promptParts = args.slice(0, -1);
    return main(promptParts);
  });
