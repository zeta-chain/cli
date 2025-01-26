import { select } from "@inquirer/prompts";

export const promptForExample = async (
  directories: { name: string; description: string }[]
): Promise<string> => {
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
};
