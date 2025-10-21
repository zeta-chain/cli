import { Command } from "commander";
import fs from "fs-extra";

import {
  isZetaChainMCPServer,
  MCP_CLIENTS,
  MCPServerConfig,
} from "../../utils/mcp";

const listMCPServers = async (): Promise<void> => {
  console.log("Checking MCP server installation status...\n");

  let foundAny = false;

  for (const [clientId, client] of Object.entries(MCP_CLIENTS)) {
    if (!(await fs.pathExists(client.configPath))) {
      console.log(`❌ ${client.name}: Not configured (no config file found)`);
      continue;
    }

    try {
      const config = await fs.readJSON(client.configPath);
      const allServers: Array<{ key: string; project: string }> = [];

      if (client.configStructure === "per-project") {
        if (config.projects && typeof config.projects === "object") {
          for (const [projectPath, projectConfig] of Object.entries(
            config.projects,
          )) {
            const proj = projectConfig as {
              mcpServers?: Record<string, MCPServerConfig>;
            };
            if (proj.mcpServers) {
              Object.entries(proj.mcpServers).forEach(([key, serverConfig]) => {
                if (isZetaChainMCPServer(serverConfig)) {
                  allServers.push({ key, project: projectPath });
                }
              });
            }
          }
        }
      } else {
        const directConfig: { mcpServers?: Record<string, MCPServerConfig> } =
          config;
        if (directConfig.mcpServers) {
          Object.entries(directConfig.mcpServers).forEach(
            ([key, serverConfig]) => {
              if (isZetaChainMCPServer(serverConfig)) {
                allServers.push({ key, project: "global" });
              }
            },
          );
        }
      }

      if (allServers.length > 0) {
        console.log(`✅ ${client.name}: Installed`);
        console.log(`   Config: ${client.configPath}`);
        allServers.forEach(({ project, key }) => {
          if (project === "global") {
            console.log(`   Server key: ${key}`);
          } else {
            console.log(`   Project: ${project}`);
            console.log(`   Server key: ${key}`);
          }
        });
        foundAny = true;
      } else {
        console.log(`❌ ${client.name}: Not installed`);
      }
    } catch (error) {
      console.log(
        `⚠️  ${client.name}: Error reading config (${(error as Error).message})`,
      );
    }
  }

  if (!foundAny) {
    console.log(
      "\n💡 Install with: zetachain mcp install --client <claude|cursor>",
    );
  }
};

export const listCommand = new Command()
  .command("list")
  .description("List MCP server installation status for all supported clients")
  .action(async () => {
    try {
      await listMCPServers();
    } catch (error) {
      console.error("Failed to list installations:", (error as Error).message);
      process.exit(1);
    }
  });
