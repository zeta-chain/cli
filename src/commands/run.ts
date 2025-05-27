import { Command } from "commander";

const main = async () => {
  console.log("Running commands...");
};

export const runCommand = new Command("run")
  .description("Run commands from the commands directory")
  .action(main);
