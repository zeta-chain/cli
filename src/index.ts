#!/usr/bin/env node
import { Command } from "commander";

import { newCommand } from "./commands/new";

const program: Command = new Command();

program
  .name("zetachain")
  .description("CLI tool for ZetaChain development.")
  .version("1.0.0");

newCommand(program);

program.parse(process.argv);
