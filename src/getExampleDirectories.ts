import fs from "fs-extra";
import path from "path";

export const getExampleDirectories = async (examplesDir: string) => {
  const entries = fs.readdirSync(examplesDir, { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory());

  if (directories.length === 0) {
    throw new Error("No examples found in the examples directory.");
  }

  const examples = await Promise.all(
    directories.map(async (dir) => {
      const packageJsonPath = path.join(examplesDir, dir.name, "package.json");
      let description = "No description available.";

      if (fs.existsSync(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        description = packageJson.description || description;
      }

      return { name: dir.name, description };
    })
  );

  return examples;
};
