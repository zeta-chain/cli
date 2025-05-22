#!/usr/bin/env node
import { localnetCommand } from "@zetachain/localnet/commands";
import { accountsCommand, solanaCommand } from "@zetachain/toolkit/commands";
import { Command } from "commander";

import { newCommand } from "./commands/new";
import registerRun from "./commands/run";

const program: Command = new Command();

program
  .name("zetachain")
  .description("CLI tool for ZetaChain development.")
  .version("dev");

program.addCommand(newCommand);
program.addCommand(localnetCommand);
program.addCommand(accountsCommand);
program.addCommand(solanaCommand);
registerRun(program);

program.parse(process.argv);
