import fs from "fs-extra";
import simpleGit from "simple-git";

export const cloneRepository = async (
  repoUrl: string,
  tempDir: string,
  branchName: string,
  options: any,
  isVerbose: boolean
) => {
  if (!options.cache || !fs.existsSync(tempDir)) {
    if (fs.existsSync(tempDir)) {
      if (isVerbose) console.log("Removing cached repository...");
      await fs.remove(tempDir);
    }

    if (isVerbose) console.log(`Cloning repository (branch: ${branchName})...`);
    const git = simpleGit();
    await git.clone(repoUrl, tempDir, ["--branch", branchName, "--depth=1"]);
    if (isVerbose) console.log("Repository cloned successfully.");
  } else {
    if (isVerbose) console.log("Using cached repository. Skipping clone.");
  }
};
