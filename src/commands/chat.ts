import { Command } from "commander";
import http from "http";
import https from "https";
import readline from "readline";
import { URL } from "url";

type ChatMessage = { content: string; role: "assistant" | "user" };

type ChatOptions = {
  apiUrl?: string;
  chatbotId?: string;
  model?: string;
  temperature?: number;
};

const DEFAULT_CHATBOT_ID = "HwoQ2Sf9rFFtdW59sbYKF";
const DEFAULT_API_URL =
  process.env.ZETACHAIN_CHAT_API_URL ||
  "https://docs-v2-git-chat-api.zetachain.app/api/chat/";

const isHttps = (url: string) => url.startsWith("https:");

const postSSE = async (
  urlStr: string,
  payload: Record<string, unknown>,
  onData: (text: string) => void
): Promise<{ body?: string; statusCode: number }> => {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const body = JSON.stringify(payload);
      const options: https.RequestOptions = {
        headers: {
          Accept: "text/event-stream",
          "Content-Length": Buffer.byteLength(body),
          "Content-Type": "application/json",
        },
        hostname: url.hostname,
        method: "POST",
        path: url.pathname + url.search,
        port: url.port || (isHttps(urlStr) ? 443 : 80),
      };

      const req = (isHttps(urlStr) ? https : (http as any)).request(
        options,
        (res: http.IncomingMessage) => {
          const statusCode = res.statusCode || 0;

          // If not an SSE, buffer and return (probably an error)
          const contentType = String(res.headers["content-type"] || "");
          if (!contentType.includes("text/event-stream")) {
            let data = "";
            res.setEncoding("utf8");
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => resolve({ body: data, statusCode }));
            return;
          }

          res.setEncoding("utf8");
          let buffer = "";
          res.on("data", (chunk) => {
            buffer += chunk;
            // Split on double newlines (end of SSE event)
            const events = buffer.split(/\n\n/);
            buffer = events.pop() || "";
            for (const evt of events) {
              // Each event can have multiple lines (event:, data:, id:)
              const lines = evt.split(/\n/);
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;
                const data = trimmed.slice(5).trim();
                if (!data || data === "[DONE]") continue;
                try {
                  const json = JSON.parse(data);
                  const text =
                    typeof json?.text === "string"
                      ? json.text
                      : typeof json?.message === "string"
                        ? json.message
                        : typeof json?.answer === "string"
                          ? json.answer
                          : typeof json === "string"
                            ? json
                            : "";
                  if (text) onData(text);
                } catch {
                  // If it's not JSON, try to print raw
                  if (data && data !== "[DONE]") onData(data);
                }
              }
            }
          });

          res.on("end", () => resolve({ statusCode }));
        }
      );

      req.on("error", () => resolve({ body: "Network error", statusCode: 0 }));
      req.write(body);
      req.end();
    } catch {
      resolve({ body: "Invalid request", statusCode: 0 });
    }
  });
};

const chatLoop = async (options: ChatOptions) => {
  const chatbotId = options.chatbotId || DEFAULT_CHATBOT_ID;
  const apiUrl = options.apiUrl || DEFAULT_API_URL;
  const messages: ChatMessage[] = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = () =>
    new Promise<string>((resolve) => rl.question("You: ", resolve));

  console.log(`Chatbot: ${chatbotId}`);
  console.log("Type '/exit' to quit.\n");

  while (true) {
    const input = (await ask()).trim();
    if (!input) continue;
    if (input.toLowerCase() === "/exit") break;

    messages.push({ content: input, role: "user" });

    process.stdout.write("Assistant: ");
    let assistantText = "";

    const payload: Record<string, unknown> = {
      chatbotId,
      messages,
      stream: true,
    };
    if (typeof options.temperature === "number") {
      payload.temperature = Math.min(1, Math.max(0, options.temperature));
    }
    if (options.model && options.model.trim()) {
      payload.model = options.model.trim();
    }

    const { statusCode, body } = await postSSE(apiUrl, payload, (chunk) => {
      assistantText += chunk;
      process.stdout.write(chunk);
    });

    if (statusCode < 200 || statusCode >= 300) {
      const prefix = assistantText ? "\n\n" : "";
      process.stdout.write(
        `${prefix}[Error ${statusCode || "Network"}] ${body || "Request failed"}`
      );
    } else {
      if (!assistantText && body) {
        // Non-SSE response path: print JSON or raw text
        try {
          const parsed = JSON.parse(body);
          const text =
            typeof parsed?.text === "string"
              ? parsed.text
              : typeof parsed?.message === "string"
                ? parsed.message
                : typeof parsed?.answer === "string"
                  ? parsed.answer
                  : typeof parsed?.data === "string"
                    ? parsed.data
                    : typeof parsed === "string"
                      ? parsed
                      : "";
          if (text) {
            assistantText = text;
            process.stdout.write(text);
          } else {
            assistantText = body;
            process.stdout.write(body);
          }
        } catch {
          assistantText = body;
          process.stdout.write(body);
        }
      }
      messages.push({ content: assistantText, role: "assistant" });
    }

    process.stdout.write("\n\n");
  }

  rl.close();
};

export const chatCommand = new Command("chat")
  .description("Chat with ZetaChain’s assistant (streams responses)")
  .option("--chatbot-id <id>", "Chatbase chatbotId to use", DEFAULT_CHATBOT_ID)
  .option("--api-url <url>", "Override chat API URL", DEFAULT_API_URL)
  .option("--model <name>", "Upstream model (optional)")
  .option("--temperature <num>", "Sampling temperature 0..1 (optional)", (v) =>
    Number(v)
  )
  .action(async (opts: ChatOptions) => {
    await chatLoop(opts || {});
  });
