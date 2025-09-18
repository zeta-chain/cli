import { Command } from "commander";
import inquirer from "inquirer";
import { v4 as uuidv4 } from "uuid";

import { DEFAULT_CHAT_API_URL, DEFAULT_CHATBOT_ID } from "../constants";
import { streamChatResponse } from "./ask/streaming";
import { createChatSpinner } from "./ask/ui";
import { validateAndSanitizePrompt } from "./ask/validation";

const main = async (promptParts: string[]): Promise<void> => {
  let conversationId: string = uuidv4();
  const messages: { role: "user" | "assistant"; content: string }[] = [];
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

    try {
      const sanitizedPrompt = validateAndSanitizePrompt(prompt);

      messages.push({ role: "user", content: sanitizedPrompt });

      const payload = {
        chatbotId: DEFAULT_CHATBOT_ID,
        messages,
        stream: true,
        conversationId,
      };

      const spinner = createChatSpinner();
      const onFirstOutput = () => {
        spinner.stop();
      };

      let assistantBuffer = "";
      await streamChatResponse(
        DEFAULT_CHAT_API_URL,
        payload,
        onFirstOutput,
        (text) => {
          assistantBuffer += text;
        }
      );
      if (assistantBuffer.trim()) {
        messages.push({ role: "assistant", content: assistantBuffer });
      }
    } catch (securityError) {
      const message =
        securityError instanceof Error
          ? securityError.message
          : String(securityError);
      console.error(`Error: ${message}`);
      process.exitCode = 1;
    }
    nextPrompt = "";
  }
};

export const askCommand = new Command("ask")
  .description("Chat with ZetaChain Docs AI")
  .argument("[prompt...]", "Prompt to send to AI")
  .action(main);
