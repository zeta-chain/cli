import { Command } from "commander";
import path from "path";
import fs from "fs/promises";

export const addLocalCommands = async (runCommand: Command) => {
  try {
    const commandsPath = path.join(process.cwd(), "commands", "index.ts");
    await fs.access(commandsPath);

    const module = await import(commandsPath);
    if (module.default?.commands) {
      for (const cmd of module.default.commands) {
        runCommand.addCommand(cmd);
      }
    }
  } catch (error) {}
};
