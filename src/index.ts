#!/usr/bin/env node
import { localnetCommand } from "@zetachain/localnet/commands";
import { Command } from "commander";

import { newCommand } from "./commands/new";

const program: Command = new Command();

program
  .name("zetachain")
  .description("CLI tool for ZetaChain development.")
  .version("dev");

program.addCommand(newCommand);
program.addCommand(localnetCommand);

program.parse(process.argv);
