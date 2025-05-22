import { Command } from "commander";
import { program as commandsProgram } from "../../commands/index.js";

export const registerRun = (program: Command) => {
  const runCommand = program
    .command("run")
    .description("Run commands from the commands directory");

  const commands = commandsProgram.commands;

  for (const cmd of commands) {
    runCommand.addCommand(cmd);
  }
};
