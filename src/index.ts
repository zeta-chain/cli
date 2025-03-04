#!/usr/bin/env node
import { Command } from "commander";
import { createCommand } from "./commands/create";

const program: Command = new Command();

program
  .name("zetachain")
  .description("CLI tool for ZetaChain development.")
  .version("1.0.0");

createCommand(program);

program.parse(process.argv);
