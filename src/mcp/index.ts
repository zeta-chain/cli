/* eslint-disable func-style */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
// Disabling eslint, because Smithery for some reason fails when functions are declared as const
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { spawn, spawnSync, SpawnSyncReturns } from "child_process";
import { z, ZodRawShape } from "zod";

import * as commandsModule from "./commands.json";

// Type definitions
interface JSONSchemaProperty {
  default?: unknown;
  enum?: string[];
  items?: {
    enum?: string[];
    type?: string;
  };
  type: "array" | "boolean" | "object" | "string";
}

interface JSONSchema {
  additionalProperties?: boolean;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  type: "object";
}

interface CommandTool {
  description: string;
  inputSchema: JSONSchema;
  name: string;
  title: string;
}

interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ text: string; type: "text" }>;
  isError: boolean;
}

interface NodeError extends Error {
  code?: string;
}

const commands = commandsModule as unknown as CommandTool[];

export const configSchema = z.object({
  debug: z.boolean().default(false).describe("Enable debug logging"),
});

function toKebabCase(input: string): string {
  return String(input)
    .replace(/_/g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

function ensureZetachainAvailable(): void {
  const result: SpawnSyncReturns<string> = spawnSync(
    "npx",
    ["-y", "zetachain", "--version"],
    {
      encoding: "utf8",
    },
  );
  const error = result.error as NodeError | undefined;
  if (error && error.code === "ENOENT") {
    throw new Error(
      "Failed to execute 'npx'. Please ensure Node.js and npm are installed.",
    );
  }
}

function toolNameToCommandPath(name: string): string[] {
  const normalized = String(name || "")
    .trim()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return [];
  return normalized.split(" ");
}

function buildArgvFromArgs(
  toolName: string,
  args: Record<string, unknown>,
): { flags: string[]; positionals: string[] } {
  const positionals: string[] = [];
  const flags: string[] = [];

  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null) continue;
    const flag = `--${toKebabCase(key)}`;

    if (typeof value === "boolean") {
      if (value) flags.push(flag);
      continue;
    }
    if (Array.isArray(value)) {
      for (const v of value) {
        flags.push(flag, String(v));
      }
      continue;
    }
    flags.push(flag, String(value));
  }

  return { flags, positionals };
}

async function spawnBinary(
  command: string,
  args: string[],
): Promise<{ exitCode: number | null; stderr: string; stdout: string }> {
  return new Promise((resolve) => {
    const child = spawn("npx", ["-y", command, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data?.toString?.() ?? "";
    });
    child.stderr.on("data", (data) => {
      stderr += data?.toString?.() ?? "";
    });
    child.on("close", (code) => {
      resolve({ exitCode: code, stderr, stdout });
    });
    child.on("error", (err: Error) => {
      const nodeError = err as NodeError;
      if (nodeError.code === "ENOENT") {
        stderr += `'npx' not found in PATH.`;
        resolve({ exitCode: 1, stderr, stdout });
        return;
      }
      stderr += `${err.message}`;
      resolve({ exitCode: 1, stderr, stdout });
    });
  });
}

async function executeCommand(
  toolName: string,
  args: Record<string, unknown>,
): Promise<{ exitCode: number | null; stderr: string; stdout: string }> {
  const commandPath = toolNameToCommandPath(toolName);
  const { positionals, flags } = buildArgvFromArgs(toolName, args);

  ensureZetachainAvailable();

  const argv = [...commandPath, ...positionals, ...flags];

  return await spawnBinary("zetachain", argv);
}

function jsonSchemaToZodShape(schema: JSONSchema): ZodRawShape {
  const props = schema.properties ?? {};
  const required = new Set<string>(schema.required ?? []);
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, prop] of Object.entries<JSONSchemaProperty>(props)) {
    let v: z.ZodTypeAny;

    if (prop.type === "boolean") {
      v = z.boolean();
    } else if (prop.type === "array") {
      const t = prop.items?.type;
      const item =
        t === "boolean"
          ? z.boolean()
          : Array.isArray(prop.items?.enum) && prop.items.enum.length > 0
            ? z.enum(prop.items.enum as [string, ...string[]])
            : z.string();
      v = z.array(item);
    } else {
      v =
        Array.isArray(prop.enum) && prop.enum.length > 0
          ? z.enum(prop.enum as [string, ...string[]])
          : z.string();
    }

    if (!required.has(key)) v = v.optional();
    if (prop.default !== undefined) v = v.default(prop.default);
    shape[key] = v;
  }

  return shape;
}

export default function createServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new McpServer({
    name: "Universal Blockchain",
    version: "1.0.0",
  });

  for (const tool of commands) {
    const name: string = String(tool?.name ?? "").trim();
    if (!name) continue;

    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: jsonSchemaToZodShape(tool.inputSchema),
        title: tool.title,
      },
      async (args: Record<string, unknown>): Promise<ToolResponse> => {
        const { stdout, stderr, exitCode } = await executeCommand(
          name,
          args ?? {},
        );
        const trimmedStdout = (stdout || "").trim();
        const showStderr = !!config?.debug;
        const text = trimmedStdout
          ? showStderr && stderr
            ? `${trimmedStdout}\n\n[stderr]\n${stderr}`
            : trimmedStdout
          : stderr
            ? `Command produced no output. Stderr:\n${stderr}`
            : `Executed '${name}'.`;
        return {
          content: [
            {
              text,
              type: "text",
            },
          ],
          isError: typeof exitCode === "number" && exitCode !== 0,
        };
      },
    );
  }

  return server.server;
}

// Start the MCP server when this file is run directly
async function main() {
  const server = createServer({ config: { debug: false } });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
