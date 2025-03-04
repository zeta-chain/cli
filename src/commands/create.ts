#!/usr/bin/env node
import os from "os";
import path from "path";
import { Command } from "commander";

import { cloneRepository } from "@/utils/cloneRepository";
import { copyExample } from "@/utils/copyExample";
import { getExampleDirectories } from "@/utils/getExampleDirectories";
import { promptForExample } from "@/utils/promptForExample";

const REPO_URL = "https://github.com/zeta-chain/example-contracts.git";
const TEMP_DIR = path.join(os.tmpdir(), "example-contracts");
const EXAMPLES_DIR = path.join(TEMP_DIR, "examples");
const BRANCH_NAME = "main";

type CreateOptions = {
  cache?: boolean;
  verbose?: boolean;
  output?: string;
  example?: string;
};

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
        (dir: any) => dir.name === exampleName
      );
      if (!matchingExample) {
        console.error(`Error: Example "${exampleName}" not found.`);
        console.error(
          "Available examples:",
          directories
            .map((dir: any) => `${dir.name} - ${dir.description}`)
            .join("\n")
        );
        process.exit(1);
      }
      chosenExample = matchingExample.name;
    } else {
      chosenExample = await promptForExample(directories);
    }

    await copyExample(chosenExample, EXAMPLES_DIR, outputDir, isVerbose);
  } catch (error: any) {
    if (isVerbose) {
      console.error("An error occurred:", error.message);
      console.error(error.stack);
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
      "Specify the example to use and skip the prompt"
    )
    .action(create);
};
