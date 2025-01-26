import { select } from "@inquirer/prompts";
import simpleGit from "simple-git";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { Command } from "commander";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";

const program = new Command();
const REPO_URL = "https://github.com/zeta-chain/example-contracts.git";
const TEMP_DIR = path.join(os.tmpdir(), "example-contracts");
const EXAMPLES_DIR = path.join(TEMP_DIR, "examples");
const BRANCH_NAME = "descriptions";

program
  .option("--no-cache", "Bypass cached repository and re-clone")
  .option("--verbose", "Enable verbose logging")
  .parse(process.argv);

const options = program.opts();
const isVerbose = options.verbose;

async function cloneRepository() {
  if (!options.cache || !fs.existsSync(TEMP_DIR)) {
    if (fs.existsSync(TEMP_DIR)) {
      if (isVerbose) console.log("Removing cached repository...");
      await fs.remove(TEMP_DIR);
    }

    if (isVerbose)
      console.log(`Cloning repository (branch: ${BRANCH_NAME})...`);
    const git = simpleGit();
    await git.clone(REPO_URL, TEMP_DIR, ["--branch", BRANCH_NAME, "--depth=1"]);
    if (isVerbose) console.log("Repository cloned successfully.");
  } else {
    if (isVerbose) console.log("Using cached repository. Skipping clone.");
  }
}

async function getExampleDirectories(): Promise<
  { name: string; description: string }[]
> {
  const entries = fs.readdirSync(EXAMPLES_DIR, { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory());

  if (directories.length === 0) {
    throw new Error("No examples found in the examples directory.");
  }

  const examples = await Promise.all(
    directories.map(async (dir) => {
      const packageJsonPath = path.join(EXAMPLES_DIR, dir.name, "package.json");
      let description = "No description available.";

      if (fs.existsSync(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        description = packageJson.description || description;
      }

      return { name: dir.name, description };
    })
  );

  return examples;
}

async function promptForExample(
  directories: { name: string; description: string }[]
): Promise<string> {
  const choices = directories.map((dir) => ({
    name: `${dir.name}\t${dir.description}`,
    value: dir.name,
    short: dir.name,
  }));

  const chosenExample = await select({
    message: "Which example do you want to create?",
    choices,
  });

  return chosenExample;
}

marked.use(markedTerminal() as any);

async function copyExample(chosenExample: string) {
  const sourceDir = path.join(EXAMPLES_DIR, chosenExample);
  const targetDir = path.join(process.cwd(), chosenExample);

  console.log(`\nCreated ${targetDir}\n`);
  await fs.copy(sourceDir, targetDir);
  if (isVerbose) console.log(`Successfully created "${chosenExample}".`);

  const readmePath = path.join(targetDir, "README.md");
  if (fs.existsSync(readmePath)) {
    const readmeContent = await fs.readFile(readmePath, "utf-8");
    console.log(marked(readmeContent));
  }
}

async function main() {
  try {
    await cloneRepository();
    const directories = await getExampleDirectories();
    const chosenExample = await promptForExample(directories);
    await copyExample(chosenExample);
  } catch (error: any) {
    if (isVerbose) {
      console.error("An error occurred:", error.message);
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
