import { Command } from "commander";
import fs from "fs";
import { EventMessage, PostHog } from "posthog-node";
import dns from "dns";
import { v4 as uuid } from "uuid";

import { getFullCommandPath } from "./commands/docs";
import {
  POSTHOG_API_KEY,
  POSTHOG_ENDPOINT,
  ZETACHAIN_CONFIG_FILE,
  ZETACHIAN_DIR,
} from "./constants";

type Config = {
  uuid?: string;
};

const getOrCreateUserUUID = (): string => {
  try {
    fs.mkdirSync(ZETACHIAN_DIR, { recursive: true });
  } catch (err) {
    console.error(`Failed to ensure config directory: ${ZETACHIAN_DIR}`, err);
  }

  let data: Config = {};
  let needsWrite = false;

  if (fs.existsSync(ZETACHAIN_CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(ZETACHAIN_CONFIG_FILE, "utf8");
      if (raw.trim()) data = JSON.parse(raw) as Config;
    } catch (err) {
      console.error(
        `Failed to read/parse ${ZETACHAIN_CONFIG_FILE}; recreating`,
        err
      );
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
        "utf8"
      );
    } catch (err) {
      console.error(`Failed to write ${ZETACHAIN_CONFIG_FILE}`, err);
    }
  }

  return data.uuid as string;
};

export const setupAnalytics = (program: Command) => {
  program.hook("preAction", async (_thisCommand, actionCommand) => {
    const opts = program.opts();
    if (opts && opts.analytics === false) return;

    if (!POSTHOG_API_KEY) return;

    // Skip analytics if the PostHog host cannot be resolved (offline).
    const canResolve = await (async () => {
      try {
        const host = new URL(POSTHOG_ENDPOINT).hostname;
        const resolve = dns.promises.lookup(host);
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("dns-timeout")), 300)
        );
        await Promise.race([resolve, timeout]);
        return true;
      } catch (_err) {
        return false;
      }
    })();
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
    } catch (_err) {
      // Skip analytics errors (e.g. offline / network failures)
    }
  });
};
