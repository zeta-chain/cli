#!/usr/bin/env node
import { localnetCommand } from "@zetachain/localnet/commands";
import {
  accountsCommand,
  bitcoinCommand,
  evmCommand,
  queryCommand,
  solanaCommand,
  suiCommand,
  tonCommand,
  zetachainCommand,
} from "@zetachain/toolkit/commands";
import { Command } from "commander";

import { setupAnalytics } from "./analytics";
import { docsCommand } from "./commands/docs";
import { newCommand } from "./commands/new";
import config from "./config.json";

const program: Command = new Command();

program
  .name("zetachain")
  .description("CLI tool for ZetaChain development.")
  .helpCommand(false)
  .version(config.version);

program.addCommand(newCommand);
program.addCommand(accountsCommand);
program.addCommand(queryCommand);
program.addCommand(zetachainCommand);
program.addCommand(evmCommand);
program.addCommand(solanaCommand);
program.addCommand(suiCommand);
program.addCommand(tonCommand);
program.addCommand(bitcoinCommand);
program.addCommand(localnetCommand);
program.addCommand(docsCommand);

setupAnalytics(program);

program.parse(process.argv);
