/* eslint-disable */
// Disabling eslint, because Smithery for some reason fails when functions are declared as const
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import commands from "./commands.json";

export const configSchema = z.object({
  debug: z.boolean().default(false).describe("Enable debug logging"),
});

export default function createServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new McpServer({
    name: "Say Hello",
    version: "1.0.0",
  });

  for (const tool of commands) {
    const name: string = String(tool?.name ?? "").trim();
    if (!name) continue;

    server.registerTool(
      tool.name,
      {
        description: tool.description,
        title: tool.title,
        inputSchema: tool.inputSchema as any,
      },
      async (args: any) => {
        return {
          content: [
            {
              type: "text",
              text: `Tool '${name}' invoked. Handler not implemented yet. Args: ${JSON.stringify(
                args ?? {}
              )}`,
            },
          ],
        } as any;
      }
    );
  }

  return server.server;
}
