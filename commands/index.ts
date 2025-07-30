#!/usr/bin/env node
import { Command } from "commander";

import { deployCommand } from "./deploy";

const program = new Command().helpCommand(false).addCommand(deployCommand);

export default program;
