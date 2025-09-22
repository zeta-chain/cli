import { Command } from "commander";

const getFullCommandPath = (cmd: Command): string => {
  if (!cmd.parent) return cmd.name();
  return `${getFullCommandPath(cmd.parent)} ${cmd.name()}`;
};

const displayCommandHelp = (cmd: Command) => {
  const commandPath = getFullCommandPath(cmd);
  console.log(`\n## ${commandPath}\n`);
  console.log("```");
  console.log(`${cmd.helpInformation()}`);
  console.log("```");

  cmd.commands.forEach((subCmd) => {
    displayCommandHelp(subCmd);
  });
};

export const outputMarkdown = (root: Command) => {
  root.commands.forEach((cmd: Command) => {
    displayCommandHelp(cmd);
  });
};
