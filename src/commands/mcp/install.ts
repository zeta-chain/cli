import { Command, Option } from "commander";
import fs from "fs-extra";
import path from "path";

import {
  isZetaChainMCPServer,
  MCP_CLIENTS,
  MCPServerConfig,
  SUPPORTED_CLIENTS,
} from "../../utils/mcp";

const installMCPServer = async (clientId: string): Promise<void> => {
  const client = MCP_CLIENTS[clientId];
  if (!client) {
    const availableClients = Object.keys(MCP_CLIENTS).join(", ");
    throw new Error(
      `Unknown client: ${clientId}. Available clients: ${availableClients}`,
    );
  }

  const cwd = process.cwd();
  console.log(`Installing ZetaChain MCP server for ${client.name}...`);

  const configDir = path.dirname(client.configPath);
  await fs.ensureDir(configDir);

  let config: Record<string, unknown> = {};
  if (await fs.pathExists(client.configPath)) {
    config = await fs.readJSON(client.configPath);
  }

  if (client.configStructure === "per-project") {
    if (!config.projects || typeof config.projects !== "object") {
      config.projects = {};
    }

    const projects = config.projects as Record<
      string,
      { mcpServers?: Record<string, MCPServerConfig> }
    >;

    if (!projects[cwd]) {
      projects[cwd] = {};
    }

    if (!projects[cwd].mcpServers) {
      projects[cwd].mcpServers = {};
    }

    // Check if ANY ZetaChain MCP server already exists in this project
    const existingServers = Object.entries(projects[cwd].mcpServers!).filter(
      ([_, serverConfig]) => isZetaChainMCPServer(serverConfig),
    );

    if (existingServers.length > 0) {
      const [[key, serverConfig]] = existingServers;
      const installType =
        serverConfig.type === "http" ? "Smithery (HTTP)" : "CLI (stdio)";
      throw new Error(
        `ZetaChain MCP server is already installed for this project via ${installType}.\n` +
          `Server key: "${key}"\n` +
          `Run 'zetachain mcp remove --client ${clientId}' to remove it first.`,
      );
    }

    projects[cwd].mcpServers!.zetachain = {
      args: ["--package=zetachain@latest", "-y", "zetachain-mcp"],
      command: "npx",
    };

    await fs.writeJSON(client.configPath, config, { spaces: 2 });

    console.log(
      `Added stdio MCP server zetachain with command: npx --package=zetachain@latest -y zetachain-mcp to local config`,
    );
    console.log(`File modified: ${client.configPath} [project: ${cwd}]`);
  } else {
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    const mcpServers = config.mcpServers as Record<string, MCPServerConfig>;

    // Check if ANY ZetaChain MCP server already exists
    const existingServers = Object.entries(mcpServers).filter(
      ([_, serverConfig]) => isZetaChainMCPServer(serverConfig),
    );

    if (existingServers.length > 0) {
      const [[key, serverConfig]] = existingServers;
      const installType =
        serverConfig.type === "http" ? "Smithery (HTTP)" : "CLI (stdio)";
      throw new Error(
        `ZetaChain MCP server is already installed via ${installType}.\n` +
          `Server key: "${key}"\n` +
          `Run 'zetachain mcp remove --client ${clientId}' to remove it first.`,
      );
    }

    mcpServers.zetachain = {
      args: ["--package=zetachain@latest", "-y", "zetachain-mcp"],
      command: "npx",
    };

    await fs.writeJSON(client.configPath, config, { spaces: 2 });

    console.log(`✓ Successfully installed ZetaChain MCP server`);
    console.log(`Config file: ${client.configPath}`);
  }

  console.log(`\nRestart ${client.name} to activate the MCP server.`);
};

export const installCommand = new Command()
  .command("install")
  .description("Install ZetaChain MCP server for your AI editor")
  .addOption(
    new Option("-c, --client <name>", "AI client to install for")
      .choices(SUPPORTED_CLIENTS)
      .makeOptionMandatory(),
  )
  .action(async (opts) => {
    try {
      await installMCPServer(opts.client.toLowerCase());
    } catch (error) {
      console.error("Installation failed:", (error as Error).message);
      process.exit(1);
    }
  });
