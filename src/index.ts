#!/usr/bin/env node
import { localnetCommand } from "@zetachain/localnet/commands";
import {
  accountsCommand,
  bitcoinCommand,
  evmCommand,
  queryCommand,
  solanaCommand,
  zetachainCommand,
} from "@zetachain/toolkit/commands";
import { Command } from "commander";

import { docsCommand } from "./commands/docs";
import { newCommand } from "./commands/new";
import config from "./config.json";

const program: Command = new Command();

program
  .name("zetachain")
  .description("CLI tool for ZetaChain development.")
  .helpCommand(false)
  .version(config.version);

program.addCommand(accountsCommand);
program.addCommand(bitcoinCommand);
program.addCommand(evmCommand);
program.addCommand(localnetCommand);
program.addCommand(newCommand);
program.addCommand(queryCommand);
program.addCommand(solanaCommand);
program.addCommand(docsCommand);
program.addCommand(zetachainCommand);

program.parse(process.argv);
