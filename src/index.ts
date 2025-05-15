#!/usr/bin/env node
import { localnetCommand } from "@zetachain/localnet/commands";
import {
  accountsCommand,
  bitcoinCommand,
  solanaCommand,
} from "@zetachain/toolkit/commands";
import { Command } from "commander";

import { newCommand } from "./commands/new";

const program: Command = new Command();

program
  .name("zetachain")
  .description("CLI tool for ZetaChain development.")
  .version("dev");

program.addCommand(newCommand);
program.addCommand(localnetCommand);
program.addCommand(accountsCommand);
program.addCommand(solanaCommand);
program.addCommand(bitcoinCommand);

program.parse(process.argv);
