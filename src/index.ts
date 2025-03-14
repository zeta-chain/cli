#!/usr/bin/env node
import { Command } from "commander";

import { createCommand } from "./commands/create";
import { localnetCommand } from "@zetachain/localnet/commands";

const program: Command = new Command();

program
  .name("zetachain")
  .description("CLI tool for ZetaChain development.")
  .version("1.0.0");

program.addCommand(createCommand);
program.addCommand(localnetCommand);

program.parse(process.argv);
