#!/usr/bin/env node
import { Command } from "commander";
import os from "os";
import path from "path";

import { cloneRepository } from "../utils/cloneRepository";
import { copyExample } from "../utils/copyExample";
import { getExampleDirectories } from "../utils/getExampleDirectories";
import { promptForExample } from "../utils/promptForExample";
import type { CreateOptions } from "../utils/types";

const REPO_URL = "https://github.com/zeta-chain/example-contracts.git";
const TEMP_DIR = path.join(os.tmpdir(), "example-contracts");
const EXAMPLES_DIR = path.join(TEMP_DIR, "examples");
const BRANCH_NAME = "main";

const create = async (options: CreateOptions): Promise<void> => {
  const isVerbose: boolean = options.verbose || false;
  const outputDir: string = options.output || process.cwd();
  const exampleName: string | undefined = options.example;

  try {
    await cloneRepository(REPO_URL, TEMP_DIR, BRANCH_NAME, options, isVerbose);
    const directories = await getExampleDirectories(EXAMPLES_DIR);

    let chosenExample: string;
    if (exampleName) {
      const matchingExample = directories.find(
        (dir) => dir.name === exampleName,
      );
      if (!matchingExample) {
        console.error(`Error: Example "${exampleName}" not found.`);
        console.error(
          "Available examples:",
          directories
            .map((dir) => `${dir.name} - ${dir.description}`)
            .join("\n"),
        );
        process.exit(1);
      }
      chosenExample = matchingExample.name;
    } else {
      chosenExample = await promptForExample(directories);
    }

    await copyExample(chosenExample, EXAMPLES_DIR, outputDir, isVerbose);
  } catch (error: unknown) {
    if (isVerbose) {
      if (error instanceof Error) {
        console.error("An error occurred:", error.message);
        console.error(error.stack);
      } else {
        console.error("An unknown error occurred:", error);
      }
    }
    process.exit(1);
  }
};

export const createCommand = (program: Command): void => {
  program
    .command("create")
    .description("Create a new universal contract project.")
    .option("--no-cache", "Bypass cached repository and re-clone")
    .option("--verbose", "Enable verbose logging")
    .option("--output <directory>", "Specify custom output directory or name")
    .option(
      "--example <exampleName>",
      "Specify the example to use and skip the prompt",
    )
    .action(create);
};
