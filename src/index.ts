#!/usr/bin/env node
import { Command } from "commander";
import os from "os";
import path from "path";

import { cloneRepository } from "./cloneRepository";
import { copyExample } from "./copyExample";
import { getExampleDirectories } from "./getExampleDirectories";
import { promptForExample } from "./promptForExample";
import clear from "clear";

const program = new Command();
const REPO_URL = "https://github.com/zeta-chain/example-contracts.git";
const TEMP_DIR = path.join(os.tmpdir(), "example-contracts");
const EXAMPLES_DIR = path.join(TEMP_DIR, "examples");
const BRANCH_NAME = "descriptions";

program
  .name("create-universal-contracts")
  .description(
    "CLI tool for creating universal contracts on ZetaChain.\n" +
      "For more information, visit: https://zetachain.com/docs"
  )
  .option("--no-cache", "Bypass cached repository and re-clone")
  .option("--verbose", "Enable verbose logging")
  .option(
    "--output <directory>",
    "Specify custom output directory or name",
    process.cwd()
  );

program.parse(process.argv);

const options = program.opts();
const isVerbose = options.verbose;
const outputDir = options.output;

const main = async () => {
  try {
    clear();
    await cloneRepository(REPO_URL, TEMP_DIR, BRANCH_NAME, options, isVerbose);
    const directories = await getExampleDirectories(EXAMPLES_DIR);
    const chosenExample = await promptForExample(directories);
    await copyExample(chosenExample, EXAMPLES_DIR, outputDir, isVerbose);
  } catch (error: any) {
    if (isVerbose) {
      console.error("An error occurred:", error.message);
      console.error(error.stack);
    }
    process.exit(1);
  }
};

main();
