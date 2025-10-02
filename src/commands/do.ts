import { Command, Option } from "commander";
import { z } from "zod";
import axios from "axios";

import { handleError } from "@zetachain/toolkit/utils";

const DEFAULT_API_URL = "https://docs-v2-git-mcp-server.zetachain.app/api/mcp";

const doOptionsSchema = z.object({
  instruction: z.string().min(1),
  model: z.string().default("gpt-4o-mini"),
  apiUrl: z.string().url().default(DEFAULT_API_URL),
  raw: z.boolean().default(false),
});

type DoOptions = z.infer<typeof doOptionsSchema>;

const main = async (options: DoOptions) => {
  try {
    const response = await axios.post(
      options.apiUrl,
      { prompt: options.instruction, model: options.model },
      { headers: { "Content-Type": "application/json" }, timeout: 120000 }
    );

    const data = response.data;

    if (options.raw) {
      // eslint-disable-next-line no-console
      console.log(
        typeof data === "string" ? data : JSON.stringify(data, null, 2)
      );
      return;
    }

    if (typeof data === "string") {
      // eslint-disable-next-line no-console
      console.log(data);
      return;
    }

    if (
      data &&
      typeof data === "object" &&
      Array.isArray((data as any).content)
    ) {
      const content = (data as any).content as Array<any>;
      const lines = content
        .map((c) => {
          if (typeof c === "string") return c;
          if (c && typeof c === "object") {
            if (
              (c as any).type === "text" &&
              typeof (c as any).text === "string"
            )
              return (c as any).text;
            if (typeof (c as any).text === "string") return (c as any).text;
          }
          return undefined;
        })
        .filter((v): v is string => Boolean(v));

      if (lines.length > 0) {
        // eslint-disable-next-line no-console
        console.log(lines.join("\n"));
        return;
      }
    }

    // Fallback to JSON
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    handleError({
      context: "Error executing AI command",
      error,
      shouldThrow: false,
    });
  }
};

export const doCommand = new Command()
  .name("do")
  .summary("Natural-language command via ZetaChain Docs MCP route")
  .argument("<instruction...>", "What you want to do, in natural language")
  .addOption(
    new Option("--model <model>", "Model name for the server route").default(
      "gpt-4o-mini"
    )
  )
  .addOption(
    new Option("--api-url <url>", "MCP API route URL").default(DEFAULT_API_URL)
  )
  .addOption(new Option("--raw", "Print raw response body").default(false))
  .action(async (instructionParts: string[], options: any) => {
    const parsed = doOptionsSchema.safeParse({
      instruction: instructionParts.join(" "),
      model: options.model,
      apiUrl: options.apiUrl,
      raw: options.raw,
    });

    if (!parsed.success) {
      handleError({
        context: "Invalid options for do command",
        error: parsed.error,
        shouldThrow: false,
      });
      return;
    }

    await main(parsed.data);
  });
