import { select } from "@inquirer/prompts";
import fs from "fs-extra";
import { marked, MarkedExtension } from "marked";
import { markedTerminal } from "marked-terminal";
import path from "path";

marked.use(markedTerminal() as MarkedExtension);

export const copyExample = async (
  chosenExample: string,
  examplesDir: string,
  outputDir: string,
  isVerbose: boolean,
) => {
  const sourceDir = path.join(examplesDir, chosenExample);

  const isOutputDirJustName =
    !path.isAbsolute(outputDir) && !outputDir.includes(path.sep);

  const targetDir = isOutputDirJustName
    ? path.resolve(process.cwd(), outputDir)
    : path.isAbsolute(outputDir)
      ? outputDir
      : path.resolve(process.cwd(), outputDir);

  const finalTargetDir = isOutputDirJustName
    ? path.join(targetDir)
    : path.join(targetDir, chosenExample);

  if (fs.existsSync(finalTargetDir)) {
    const overwrite = await select({
      choices: [
        { name: "Yes, overwrite it", value: true },
        { name: "No, cancel the operation", value: false },
      ],
      message: `The directory "${finalTargetDir}" already exists. Do you want to overwrite it?`,
    });

    if (!overwrite) {
      console.log("Operation canceled. No files were copied.");
      return;
    }

    if (isVerbose)
      console.log(`Removing existing directory: ${finalTargetDir}...`);
    await fs.remove(finalTargetDir);
  }

  if (isVerbose) console.log(`Copying example to ${finalTargetDir}...`);
  await fs.copy(sourceDir, finalTargetDir);

  console.log(`\nCreated ${finalTargetDir}\n`);
  if (isVerbose) console.log(`Successfully created "${chosenExample}".`);

  const readmePath = path.join(finalTargetDir, "README.md");
  if (fs.existsSync(readmePath)) {
    const readmeContent = await fs.readFile(readmePath, "utf-8");
    console.log(marked(readmeContent));
  }
};
