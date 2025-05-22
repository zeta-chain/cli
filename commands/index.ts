#!/usr/bin/env node
import { Command } from "commander";
import deploy from "./deploy.js";
import run from "../src/commands/run.js";

const program = new Command();

deploy(program);
run(program);

program.parse(process.argv);
