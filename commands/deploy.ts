import { Command } from "commander";

const main = async () => {
  console.log("Deploying example contract...");
};

export const deployCommand = new Command("deploy")
  .description("Deploy example contract.")
  .action(main);
