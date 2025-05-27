import { Command } from "commander";

export const runCommand = new Command("run")
  .helpCommand(false)
  .description("Run commands from the commands directory");
