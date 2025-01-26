import { select } from "@inquirer/prompts";

export const promptForExample = async (
  directories: { description: string; name: string }[],
): Promise<string> => {
  const choices = directories.map((dir) => ({
    name: `${dir.name}\t${dir.description}`,
    short: dir.name,
    value: dir.name,
  }));

  const chosenExample = await select({
    choices,
    message: "Which example do you want to create?",
  });

  return chosenExample;
};
