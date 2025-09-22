import type { Argument, Option } from "commander";
import { Command } from "commander";

type JSONSchema = Record<string, unknown>;

type CommandWithInternals = Command & {
  _actionHandler?: unknown;
  _executableHandler?: unknown;
  registeredArguments?: Argument[];
};

export const getFullCommandPath = (cmd: Command): string => {
  if (!cmd.parent) return cmd.name();
  return `${getFullCommandPath(cmd.parent)} ${cmd.name()}`;
};

const toTitleCase = (text: string): string => {
  return text
    .split(/\s+/)
    .filter((p) => p.length > 0)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
};

const toSnakeCase = (text: string): string => {
  return (
    text
      .trim()
      .toLowerCase()
      // Replace spaces with underscores, but keep dashes as is
      .replace(/\s+/g, "_")
      // Replace any remaining disallowed chars (excluding dashes and underscores) with underscore
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
  );
};

const argumentToSchema = (
  arg: Argument
): { isRequired: boolean; schema: JSONSchema } => {
  const isVariadic: boolean = Boolean(
    (arg as unknown as { variadic?: boolean })?.variadic
  );
  const isRequired: boolean = Boolean(
    (arg as unknown as { required?: boolean })?.required
  );
  const description: string = String(
    (arg as unknown as { summary?: string })?.summary || ""
  );

  const schema: JSONSchema = isVariadic
    ? { items: { type: "string" }, type: "array" }
    : { type: "string" };

  if (description) (schema as { summary?: string }).summary = description;

  return { isRequired, schema };
};

const optionToSchema = (
  opt: Option
): { isMandatory: boolean; name: string; schema: JSONSchema } => {
  const name: string =
    typeof opt.attributeName === "function"
      ? opt.attributeName()
      : String(
          (opt as unknown as { long?: string; short?: string })?.long ||
            (opt as unknown as { long?: string; short?: string })?.short ||
            ""
        ).replace(/^--?/, "");
  const description: string = String(
    (opt as unknown as { summary?: string })?.summary || ""
  );
  const isBoolean: boolean =
    typeof opt.isBoolean === "function" ? opt.isBoolean() : false;
  const isMandatory: boolean = Boolean(
    (opt as unknown as { mandatory?: boolean })?.mandatory
  );
  const choices: string[] | undefined = Array.isArray(
    (opt as unknown as { argChoices?: string[] })?.argChoices
  )
    ? (opt as unknown as { argChoices?: string[] })?.argChoices
    : undefined;
  const defaultValue = (opt as unknown as { defaultValue?: unknown })
    ?.defaultValue;

  const schema: JSONSchema = isBoolean
    ? { type: "boolean" }
    : { type: "string" };
  if (choices && choices.length > 0)
    (schema as { enum?: string[] }).enum = choices;
  if (description) (schema as { summary?: string }).summary = description;
  if (defaultValue !== undefined)
    (schema as { default?: unknown }).default = defaultValue;

  return { isMandatory, name, schema };
};

const buildInputSchemaForCommand = (cmd: Command): JSONSchema => {
  const properties: Record<string, JSONSchema> = {};
  const required: string[] = [];

  const args: Argument[] =
    (cmd as CommandWithInternals)?.registeredArguments || [];
  args.forEach((arg, index) => {
    const argName: string =
      typeof arg.name === "function" ? arg.name() : `arg${index + 1}`;
    const { schema, isRequired } = argumentToSchema(arg);
    properties[argName] = schema;
    if (isRequired) required.push(argName);
  });

  const opts: readonly Option[] = cmd.options;
  opts.forEach((opt) => {
    const { name, schema, isMandatory } = optionToSchema(opt);
    properties[name] = schema;
    if (isMandatory) required.push(name);
  });

  const result: JSONSchema = {
    additionalProperties: false,
    properties,
    type: "object",
  };
  if (required.length > 0)
    (result as { required?: string[] }).required = required;
  return result;
};

interface ToolDoc {
  description: string;
  inputSchema: JSONSchema;
  name: string;
  title: string;
}

const commandToToolJson = (cmd: Command): ToolDoc => {
  const fullPath = getFullCommandPath(cmd).replace(/^zetachain\s+/, "");
  const name = toSnakeCase(fullPath);
  const title = toTitleCase(fullPath);
  const description = cmd.summary() || title;

  return {
    description,
    inputSchema: buildInputSchemaForCommand(cmd),
    name,
    title,
  };
};

const isRunnableCommand = (cmd: Command): boolean => {
  const internals = cmd as CommandWithInternals;
  return Boolean(internals?._actionHandler || internals?._executableHandler);
};

const collectToolsJson = (cmd: Command): ToolDoc[] => {
  const list: ToolDoc[] = [];
  const shouldSkip = typeof cmd.name === "function" && cmd.name() === "ask";
  if (isRunnableCommand(cmd) && !shouldSkip) {
    list.push(commandToToolJson(cmd));
  }
  cmd.commands.forEach((sub) => {
    list.push(...collectToolsJson(sub));
  });
  return list;
};

export const outputJSON = (root: Command) => {
  const tools: ToolDoc[] = [];
  root.commands.forEach((cmd: Command) => {
    tools.push(...collectToolsJson(cmd));
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(tools, null, 2));
};
