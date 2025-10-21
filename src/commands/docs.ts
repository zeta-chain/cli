import { Command } from "commander";

import { outputJSON } from "./docs/outputJSON";
import { outputMarkdown } from "./docs/outputMarkdown";

export const main = (opts: { json?: boolean }, command: Command) => {
  const parent = command.parent;
  if (!parent) {
    console.error("No parent command found");
    return;
  }

  if (opts?.json) {
    outputJSON(parent);
    return;
  }

  outputMarkdown(parent);
};

export const docsCommand = new Command()
  .name("docs")
  .description(
    "Display help information for all available commands and their subcommands",
  )
  .option("--json", "Output documentation as JSON (tools schema)")
  .action(main);
