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

const toTitleCase = (text: string): string => {
  return text
    .split(/\s+/)
    .filter((p) => p.length > 0)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
};

const toSnakeCase = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const argumentToSchema = (arg: any) => {
  const isVariadic: boolean = Boolean(arg?.variadic);
  const isRequired: boolean = Boolean(arg?.required);
  const description: string = String(arg?.description || "");

  const schema: any = isVariadic
    ? { items: { type: "string" }, type: "array" }
    : { type: "string" };

  if (description) schema.description = description;

  return { isRequired, schema } as {
    isRequired: boolean;
    schema: Record<string, unknown>;
  };
};

const optionToSchema = (opt: any) => {
  const name: string =
    typeof opt?.attributeName === "function"
      ? opt.attributeName()
      : String(opt?.long || opt?.short || "").replace(/^--?/, "");
  const description: string = String(opt?.description || "");
  const isBoolean: boolean =
    typeof opt?.isBoolean === "function" ? opt.isBoolean() : false;
  const isMandatory: boolean = Boolean(opt?.mandatory);
  const choices: string[] | undefined = Array.isArray(opt?.argChoices)
    ? opt.argChoices
    : undefined;
  const defaultValue = opt?.defaultValue;

  const schema: any = isBoolean ? { type: "boolean" } : { type: "string" };
  if (choices && choices.length > 0) schema.enum = choices;
  if (description) schema.description = description;
  if (defaultValue !== undefined) schema.default = defaultValue;

  return { isMandatory, name, schema } as {
    isMandatory: boolean;
    name: string;
    schema: Record<string, unknown>;
  };
};

const buildInputSchemaForCommand = (cmd: Command) => {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  const args: any[] = (cmd as any)?.registeredArguments || [];
  args.forEach((arg, index) => {
    const argName: string =
      typeof arg?.name === "function" ? arg.name() : `arg${index + 1}`;
    const { schema, isRequired } = argumentToSchema(arg);
    properties[argName] = schema;
    if (isRequired) required.push(argName);
  });

  const opts: any[] = (cmd.options as any[]) || [];
  opts.forEach((opt) => {
    const { name, schema, isMandatory } = optionToSchema(opt);
    properties[name] = schema;
    if (isMandatory) required.push(name);
  });

  return {
    additionalProperties: false,
    properties,
    required: required.length > 0 ? required : undefined,
    type: "object",
  } as Record<string, unknown>;
};

const commandToToolJson = (cmd: Command) => {
  const fullPath = getFullCommandPath(cmd).replace(/^zetachain\s+/, "");
  const name = toSnakeCase(fullPath);
  const title = toTitleCase(fullPath);
  const description = cmd.description() || title;

  return {
    description,
    inputSchema: buildInputSchemaForCommand(cmd),
    name,
    title,
  } as Record<string, unknown>;
};

const isRunnableCommand = (cmd: Command): boolean => {
  const anyCmd = cmd as any;
  return Boolean(anyCmd?._actionHandler || anyCmd?._executableHandler);
};

const collectToolsJson = (cmd: Command): Record<string, unknown>[] => {
  const list: Record<string, unknown>[] = [];
  if (isRunnableCommand(cmd)) {
    list.push(commandToToolJson(cmd));
  }
  cmd.commands.forEach((sub) => {
    list.push(...collectToolsJson(sub));
  });
  return list;
};

export const docsCommand = new Command()
  .name("docs")
  .description(
    "Display help information for all available commands and their subcommands",
  )
  .option("--json", "Output documentation as JSON (tools schema)")
  .action((opts: { json?: boolean }, command: Command) => {
    const parent = command.parent;
    if (!parent) {
      console.error("No parent command found");
      return;
    }

    if (opts?.json) {
      const tools: Record<string, unknown>[] = [];
      parent.commands.forEach((cmd: Command) => {
        tools.push(...collectToolsJson(cmd));
      });
      console.log(JSON.stringify(tools, null, 2));
      return;
    }

    parent.commands.forEach((cmd: Command) => {
      displayCommandHelp(cmd);
    });
  });
