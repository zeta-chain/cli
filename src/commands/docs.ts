import { Command } from "commander";

export const getFullCommandPath = (cmd: Command): string => {
  if (!cmd.parent) return cmd.name();
  return `${getFullCommandPath(cmd.parent)} ${cmd.name()}`;
};

const displayCommandHelp = (cmd: Command, depth: number = 0) => {
  const commandPath = getFullCommandPath(cmd);
  console.log(`\n## ${commandPath}\n`);
  console.log("```");
  console.log(`${cmd.helpInformation()}`);
  console.log("```");

  cmd.commands.forEach((subCmd) => {
    displayCommandHelp(subCmd, depth + 1);
  });
};

export const docsCommand = new Command()
  .name("docs")
  .description(
    "Display help information for all available commands and their subcommands"
  )
  .action((_, command) => {
    const parent = command.parent;
    if (!parent) {
      console.error("No parent command found");
      return;
    }
    parent.commands.forEach((cmd: Command) => {
      displayCommandHelp(cmd);
    });
  });
