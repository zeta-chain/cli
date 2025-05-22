import { Command } from "commander";
import fs from "fs";
import path from "path";

export default function registerRun(program: Command) {
  const runCommand = program
    .command("run")
    .description("Run commands from the commands directory");

  // Get the commands directory path
  const commandsDir = path.join(process.cwd(), "commands");

  // Read all files in the commands directory
  const files = fs.readdirSync(commandsDir);

  // Filter out index.ts and load all other .ts files
  const commandFiles = files.filter(
    (file) => file.endsWith(".ts") && file !== "index.ts"
  );

  // Load each command file
  for (const file of commandFiles) {
    const commandPath = path.join(commandsDir, file);
    const commandModule = require(commandPath);

    // Get the command name from the filename (without extension)
    const commandName = path.basename(file, ".ts");

    // Create a subcommand for each loaded command
    runCommand
      .command(commandName)
      .description(`Run ${commandName} command`)
      .action(() => {
        // Execute the command's action
        const command = new Command();
        commandModule.default(command);
        command.parse([
          process.argv[0],
          process.argv[1],
          ...process.argv.slice(3),
        ]);
      });
  }
}
