#!/usr/bin/env node
import { Command } from "commander";

import { deployCommand } from "./deploy.js";

const program = new Command().helpCommand(false).addCommand(deployCommand);

if (require.main === module) program.parse();

export default program;
