/**
 * 👋 Welcome to your Smithery project!
 * To run your server, run "npm run dev"
 *
 * You might find these resources useful:
 *
 * 🧑‍💻 MCP's TypeScript SDK (helps you define your server)
 * https://github.com/modelcontextprotocol/typescript-sdk
 *
 * 📝 smithery.yaml (defines user-level config, like settings or API keys)
 * https://smithery.ai/docs/build/project-config/smithery-yaml
 *
 * 💻 smithery CLI (run "npx @smithery/cli dev" or explore other commands below)
 * https://smithery.ai/docs/concepts/cli
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Optional: If you have user-level config, define it here
// This should map to the config in your smithery.yaml file
export const configSchema = z.object({
  debug: z.boolean().default(false).describe("Enable debug logging"),
});

export const createServer = ({
  config,
}: {
  config: z.infer<typeof configSchema>; // Define your config in smithery.yaml
}) => {
  const server = new McpServer({
    name: "Say Hello",
    version: "1.0.0",
  });

  // Add a tool
  server.registerTool(
    "hello",
    {
      description: "Say hello to someone",
      inputSchema: { name: z.string().describe("Name to greet") } as any,
      title: "Hello Tool",
    },
    async (args: any, _extra?: any) => {
      const name: string = String(args?.name ?? "");
      return {
        content: [{ text: `Hello, ${name}!`, type: "text" }],
      } as any;
    }
  );

  // Add a resource
  server.registerResource(
    "hello-world-history",
    "history://hello-world",
    {
      description: "The origin story of the famous 'Hello, World' program",
      title: "Hello World History",
    },
    async (uri) => ({
      contents: [
        {
          mimeType: "text/plain",
          text: '"Hello, World" first appeared in a 1972 Bell Labs memo by Brian Kernighan and later became the iconic first program for beginners in countless languages.',
          uri: uri.href,
        },
      ],
    })
  );

  // Add a prompt
  server.registerPrompt(
    "greet",
    {
      argsSchema: {
        name: z.string().describe("Name of the person to greet"),
      } as any,
      description: "Say hello to someone",
      title: "Hello Prompt",
    },
    async (args: any, _extra?: any) => {
      const name: string = String(args?.name ?? "");
      return {
        messages: [
          {
            content: { text: `Say hello to ${name}`, type: "text" },
            role: "user",
          },
        ],
      } as any;
    }
  );

  return server.server;
};
