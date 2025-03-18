#!/usr/bin/env node
import { localnetCommand } from "@zetachain/localnet/commands";
import { Command } from "commander";

import { createCommand } from "./commands/create";

const program: Command = new Command();

program
  .name("zetachain")
  .description("CLI tool for ZetaChain development.")
  .version("dev");

program.addCommand(createCommand);
program.addCommand(localnetCommand);

program.parse(process.argv);
