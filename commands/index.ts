#!/usr/bin/env node
import { Command } from "commander";
import { deployCommand } from "./deploy.js";

export const program = new Command();

program.addCommand(deployCommand);
