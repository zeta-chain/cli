import { Command } from "commander";

import { installCommand } from "./install";
import { listCommand } from "./list";
import { removeCommand } from "./remove";

export const mcpCommand = new Command()
  .command("mcp")
  .description("MCP server management commands")
  .addCommand(installCommand)
  .addCommand(removeCommand)
  .addCommand(listCommand)
  .helpCommand(false);
