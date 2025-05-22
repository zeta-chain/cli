import { Command } from "commander";

export default function registerDeploy(program: Command) {
  program
    .command("deploy")
    .description("Deploy example contract")
    .action(() => {
      console.log("Deploying example contract...");
    });
}
