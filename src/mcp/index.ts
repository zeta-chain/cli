/* eslint-disable */
// Disabling eslint, because Smithery for some reason fails when functions are declared as const
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z, ZodRawShape } from "zod";
import { spawn, spawnSync } from "child_process";
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
        const { stdout, stderr, exitCode } = await executeCommand(
          name,
          args ?? {}
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
              type: "text",
              text,
            },
          ],
          isError: typeof exitCode === "number" && exitCode !== 0,
        } as any;
      }
    );
  }

  return server.server;
}

async function executeCommand(
  toolName: string,
  args: Record<string, unknown>
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  const commandPath = toolNameToCommandPath(toolName);
  const { positionals, flags } = buildArgvFromArgs(toolName, args);

  ensureZetachainAvailable();

  const argv = [...commandPath, ...positionals, ...flags];

  return await spawnBinary("zetachain", argv);
}

function ensureZetachainAvailable(): void {
  const result = spawnSync("npx", ["-y", "zetachain", "--version"], {
    encoding: "utf8",
  });
  if (result.error && (result.error as any).code === "ENOENT") {
    throw new Error(
      "Failed to execute 'npx'. Please ensure Node.js and npm are installed."
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
  args: Record<string, unknown>
): { positionals: string[]; flags: string[] } {
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

  return { positionals, flags };
}

function toKebabCase(input: string): string {
  return String(input)
    .replace(/_/g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

async function spawnBinary(
  command: string,
  args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
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
      resolve({ stdout, stderr, exitCode: code });
    });
    child.on("error", (err: any) => {
      if (err && err.code === "ENOENT") {
        stderr += `'npx' not found in PATH.`;
        resolve({ stdout, stderr, exitCode: 1 });
        return;
      }
      stderr += `${err?.message ?? String(err)}`;
      resolve({ stdout, stderr, exitCode: 1 });
    });
  });
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
