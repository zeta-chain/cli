/* eslint-disable */
// Disabling eslint, because Smithery for some reason fails when functions are declared as const
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z, ZodRawShape } from "zod";
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
        inputSchema: jsonSchemaToZodShape(tool.inputSchema),
      } as any,
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

const jsonSchemaToZodShape = (schema: any): ZodRawShape => {
  const props = schema?.properties ?? {};
  const required = new Set<string>(schema?.required ?? []);
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, prop] of Object.entries<any>(props)) {
    let v: z.ZodTypeAny;

    if (prop.type === "boolean") {
      v = z.boolean();
    } else if (prop.type === "array") {
      const t = prop.items?.type;
      const item =
        t === "boolean"
          ? z.boolean()
          : Array.isArray(prop.items?.enum) && prop.items.enum.length
            ? z.enum(prop.items.enum as [string, ...string[]])
            : z.string();
      v = z.array(item);
    } else {
      v =
        Array.isArray(prop.enum) && prop.enum.length
          ? z.enum(prop.enum as [string, ...string[]])
          : z.string();
    }

    if (!required.has(key)) v = v.optional();
    if (prop.default !== undefined) v = v.default(prop.default);
    shape[key] = v;
  }

  return shape as ZodRawShape;
};
