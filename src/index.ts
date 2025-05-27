#!/usr/bin/env node
import { localnetCommand } from "@zetachain/localnet/commands";
import { accountsCommand, solanaCommand } from "@zetachain/toolkit/commands";
import { Command } from "commander";
import path from "path";
import fs from "fs/promises";
import { newCommand } from "./commands/new";
import { runCommand } from "./commands/run";

const program: Command = new Command();

const loadCommands = async (command: Command) => {
  const commandsPath = path.join(process.cwd(), "commands", "index.ts");

  try {
    await fs.access(commandsPath);

    const module = await import(commandsPath);
    console.log(module.default);
  } catch (error) {}
};

const main = async () => {
  program
    .name("zetachain")
    .description("CLI tool for ZetaChain development.")
    .version("dev");

  program.addCommand(newCommand);
  program.addCommand(localnetCommand);
  program.addCommand(accountsCommand);
  program.addCommand(solanaCommand);
  program.addCommand(runCommand);

  await loadCommands(runCommand);

  program.parse(process.argv);
};

main();
