#!/usr/bin/env node
import { localnetCommand } from "@zetachain/localnet/commands";
import { accountsCommand, solanaCommand } from "@zetachain/toolkit/commands";
import { Command } from "commander";

import { newCommand } from "./commands/new";
import { runCommand } from "./commands/run";
import { addLocalCommands } from "./utils/addLocalCommands";
const program: Command = new Command();

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

  await addLocalCommands(runCommand);

  program.parse(process.argv);
};

main();
