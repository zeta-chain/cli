import os from "os";
import path from "path";

export interface MCPServerConfig {
  [key: string]: unknown;
  args?: string[];
  command?: string;
  type?: string;
  url?: string;
}

export interface MCPClientConfig {
  configPath: string;
  /**
   * Structure type for MCP server config:
   * - "per-project": Stores servers under projects[path].mcpServers (Claude Code)
   * - "global": Stores servers at root mcpServers level (Cursor, standard MCP)
   */
  configStructure: "global" | "per-project";
  name: string;
}

export const MCP_CLIENTS: Record<string, MCPClientConfig> = {
  claude: {
    configPath: path.join(os.homedir(), ".claude.json"),
    configStructure: "per-project",
    name: "Claude Code",
  },
  cursor: {
    configPath: path.join(os.homedir(), ".cursor", "mcp.json"),
    configStructure: "global",
    name: "Cursor",
  },
};

export const SUPPORTED_CLIENTS = Object.keys(MCP_CLIENTS);

/**
 * Checks if an MCP server configuration is for ZetaChain
 * Detects both stdio (CLI) and HTTP (Smithery) installations
 */
export const isZetaChainMCPServer = (
  serverConfig: MCPServerConfig,
): boolean => {
  // Check for HTTP/SSE installation (Smithery)
  if (serverConfig.type === "http" && serverConfig.url) {
    const url = String(serverConfig.url);
    return (
      url.includes("smithery.ai/@zeta-chain/cli") ||
      url.includes("zetachain") ||
      url.includes("zeta-chain")
    );
  }

  // Check for stdio installation (CLI)
  if (!serverConfig.args || !Array.isArray(serverConfig.args)) {
    return false;
  }

  return serverConfig.args.some(
    (arg) =>
      typeof arg === "string" &&
      (arg.includes("zetachain-mcp") || arg.includes("/mcp/index.js")),
  );
};
