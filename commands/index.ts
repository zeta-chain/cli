#!/usr/bin/env node
import { Command } from "commander";
import deploy from "./deploy.js";

const program = new Command();

deploy(program);

program.parse(process.argv);
