import fs from "fs-extra";
import simpleGit from "simple-git";

export const cloneRepository = async (
  repoUrl: string,
  tempDir: string,
  branchName: string,
  isVerbose: boolean,
) => {
  if (fs.existsSync(tempDir)) {
    if (isVerbose) console.log("Removing existing repository...");
    await fs.remove(tempDir);
  }

  if (isVerbose) console.log(`Cloning repository (branch: ${branchName})...`);
  const git = simpleGit();
  await git.clone(repoUrl, tempDir, ["--branch", branchName, "--depth=1"]);
  if (isVerbose) console.log("Repository cloned successfully.");
};
