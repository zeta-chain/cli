import inquirer from "inquirer";
import simpleGit from "simple-git";
import fs from "fs-extra";
import path from "path";
import os from "os";

const REPO_URL = "https://github.com/zeta-chain/example-contracts.git";
const TEMP_DIR = path.join(os.tmpdir(), "example-contracts");
const EXAMPLES_DIR = path.join(TEMP_DIR, "examples");

async function main() {
  try {
    if (!fs.existsSync(TEMP_DIR)) {
      console.log("Cloning repository...");
      const git = simpleGit();
      await git.clone(REPO_URL, TEMP_DIR, ["--depth=1"]); // Shallow clone
      console.log("Repository cloned successfully.");
    } else {
      console.log("Repository already cloned. Skipping clone.");
    }

    const directories = fs
      .readdirSync(EXAMPLES_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    if (directories.length === 0) {
      console.error("No examples found in the examples directory.");
      process.exit(1);
    }

    const { chosenExample } = await inquirer.prompt([
      {
        type: "list",
        name: "chosenExample",
        message: "Which example do you want to create?",
        choices: directories,
      },
    ]);

    const sourceDir = path.join(EXAMPLES_DIR, chosenExample);
    const targetDir = path.join(process.cwd(), chosenExample);

    console.log(`\nCopying "${chosenExample}" to "${targetDir}"...`);
    await fs.copy(sourceDir, targetDir);
    console.log(`Successfully created "${chosenExample}".`);
  } catch (error: any) {
    console.error("An error occurred:", error.message);
    process.exit(1);
  }
}

main();
