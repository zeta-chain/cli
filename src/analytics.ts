import { Command } from "commander";
import dns from "dns";
import fs from "fs";
import { EventMessage, PostHog } from "posthog-node";
import { v4 as uuid } from "uuid";

import { getFullCommandPath } from "./commands/docs";
import {
  POSTHOG_API_KEY,
  POSTHOG_ENDPOINT,
  ZETACHAIN_CONFIG_FILE,
  ZETACHAIN_DIR,
} from "./constants";

type Config = {
  uuid?: string;
};

const getOrCreateUserUUID = (): string => {
  try {
    fs.mkdirSync(ZETACHAIN_DIR, { recursive: true });
  } catch {
    // Silently continue - analytics will work without persistent config
  }

  let data: Config = {};
  let needsWrite = false;

  if (fs.existsSync(ZETACHAIN_CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(ZETACHAIN_CONFIG_FILE, "utf8");
      if (raw.trim()) data = JSON.parse(raw) as Config;
    } catch (err) {
      // Silently recreate config if corrupted
      data = {};
      needsWrite = true;
    }
  } else {
    needsWrite = true;
  }

  if (!data || typeof data !== "object") {
    data = {};
    needsWrite = true;
  }

  if (!data.uuid || typeof data.uuid !== "string" || data.uuid.length === 0) {
    data.uuid = uuid();
    needsWrite = true;
  }

  if (needsWrite) {
    try {
      fs.writeFileSync(
        ZETACHAIN_CONFIG_FILE,
        JSON.stringify(data, null, 2),
        "utf8",
      );
    } catch {
      // Silently continue - will generate new UUID next time
    }
  }

  return data.uuid as string;
};

const canResolveHost = async (
  hostname: string,
  timeout = 300,
): Promise<boolean> => {
  try {
    const resolve = dns.promises.lookup(hostname);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("dns-timeout")), timeout),
    );
    await Promise.race([resolve, timeoutPromise]);
    return true;
  } catch (_err) {
    return false;
  }
};

export const setupAnalytics = (program: Command) => {
  program.hook("preAction", async (_thisCommand, actionCommand) => {
    const opts = program.opts();
    if (opts && opts.analytics === false) return;

    if (!POSTHOG_API_KEY) return;

    // Skip analytics if the PostHog host cannot be resolved (offline).
    const host = new URL(POSTHOG_ENDPOINT).hostname;
    const canResolve = await canResolveHost(host);
    if (!canResolve) return;

    let analytics: PostHog | null = null;
    try {
      analytics = new PostHog(POSTHOG_API_KEY, {
        host: POSTHOG_ENDPOINT,
      });
      analytics.on("error", () => {});

      const event: EventMessage = {
        distinctId: getOrCreateUserUUID(),
        event: "ZetaChain CLI command executed",
        properties: {
          command: getFullCommandPath(actionCommand),
        },
      };
      analytics.capture(event);

      await analytics.shutdown();
    } catch {
      // Skip analytics errors (e.g. offline / network failures), to prevent CLI disruption
    }
  });
};
