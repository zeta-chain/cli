import { Command, Option } from "commander";
import fs from "fs-extra";

import {
  isZetaChainMCPServer,
  MCP_CLIENTS,
  MCPServerConfig,
  SUPPORTED_CLIENTS,
} from "../../utils/mcp";

const removeMCPServer = async (clientId: string): Promise<void> => {
  const client = MCP_CLIENTS[clientId];
  if (!client) {
    const availableClients = Object.keys(MCP_CLIENTS).join(", ");
    throw new Error(
      `Unknown client: ${clientId}. Available clients: ${availableClients}`,
    );
  }

  console.log(`Removing ZetaChain MCP server from ${client.name}...`);

  if (!(await fs.pathExists(client.configPath))) {
    console.log(`No config file found at ${client.configPath}`);
    return;
  }

  const config = await fs.readJSON(client.configPath);
  let removedCount = 0;

  if (client.configStructure === "per-project") {
    if (config.projects && typeof config.projects === "object") {
      for (const [projectPath, projectConfig] of Object.entries(
        config.projects,
      )) {
        const proj = projectConfig as {
          mcpServers?: Record<string, MCPServerConfig>;
        };
        if (proj.mcpServers) {
          const keysToRemove: string[] = [];
          Object.entries(proj.mcpServers).forEach(([key, serverConfig]) => {
            if (isZetaChainMCPServer(serverConfig)) {
              keysToRemove.push(key);
            }
          });

          keysToRemove.forEach((key) => {
            delete proj.mcpServers![key];
            console.log(`  Removed '${key}' from project: ${projectPath}`);
            removedCount++;
          });
        }
      }
    }
  } else {
    const directConfig: { mcpServers?: Record<string, MCPServerConfig> } =
      config;
    if (directConfig.mcpServers) {
      const keysToRemove: string[] = [];
      Object.entries(directConfig.mcpServers).forEach(([key, serverConfig]) => {
        if (isZetaChainMCPServer(serverConfig)) {
          keysToRemove.push(key);
        }
      });

      keysToRemove.forEach((key) => {
        delete directConfig.mcpServers![key];
        console.log(`  Removed '${key}'`);
        removedCount++;
      });
    }
  }

  if (removedCount === 0) {
    console.log(`ZetaChain MCP server is not installed for ${client.name}`);
    return;
  }

  await fs.writeJSON(client.configPath, config, { spaces: 2 });

  console.log(
    `\n✓ Successfully removed ${removedCount} ZetaChain MCP server(s) from ${client.name}`,
  );
  console.log(`\nRestart ${client.name} to apply changes.`);
};

export const removeCommand = new Command()
  .command("remove")
  .description(
    "Remove ZetaChain MCP server from your AI editor (removes from all projects if applicable)",
  )
  .addOption(
    new Option("-c, --client <name>", "AI client to remove from")
      .choices(SUPPORTED_CLIENTS)
      .makeOptionMandatory(),
  )
  .action(async (opts) => {
    try {
      await removeMCPServer(opts.client.toLowerCase());
    } catch (error) {
      console.error("Removal failed:", (error as Error).message);
      process.exit(1);
    }
  });
