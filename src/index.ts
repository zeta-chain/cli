import inquirer from "inquirer";
import simpleGit from "simple-git";
import fs from "fs-extra";
import path from "path";
import os from "os";

const REPO_URL = "https://github.com/zeta-chain/example-contracts.git";
const TEMP_DIR = path.join(os.tmpdir(), "example-contracts");
const EXAMPLES_DIR = path.join(TEMP_DIR, "examples");

async function cloneRepository() {
  if (!fs.existsSync(TEMP_DIR)) {
    console.log("Cloning repository...");
    const git = simpleGit();
    await git.clone(REPO_URL, TEMP_DIR, ["--depth=1"]);
    console.log("Repository cloned successfully.");
  } else {
    console.log("Repository already cloned. Skipping clone.");
  }
}

async function getExampleDirectories(): Promise<string[]> {
  const entries = fs.readdirSync(EXAMPLES_DIR, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (directories.length === 0) {
    throw new Error("No examples found in the examples directory.");
  }

  return directories;
}

async function promptForExample(directories: string[]): Promise<string> {
  const { chosenExample } = await inquirer.prompt([
    {
      type: "list",
      name: "chosenExample",
      message: "Which example do you want to create?",
      choices: directories,
    },
  ]);

  return chosenExample;
}

async function copyExample(chosenExample: string) {
  const sourceDir = path.join(EXAMPLES_DIR, chosenExample);
  const targetDir = path.join(process.cwd(), chosenExample);

  console.log(`\nCopying "${chosenExample}" to "${targetDir}"...`);
  await fs.copy(sourceDir, targetDir);
  console.log(`Successfully created "${chosenExample}".`);
}

async function main() {
  try {
    await cloneRepository();
    const directories = await getExampleDirectories();
    const chosenExample = await promptForExample(directories);
    await copyExample(chosenExample);
  } catch (error: any) {
    console.error("An error occurred:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
