import { Command } from "commander";
import { EventMessage, PostHog } from "posthog-node";
import { v4 as uuid } from "uuid";
import fs from "fs";

import { getFullCommandPath } from "./commands/docs";
import {
  POSTHOG_API_KEY,
  POSTHOG_ENDPOINT,
  ZETACHIAN_DIR,
  ZETACHAIN_CONFIG_FILE,
} from "./constants";

const getOrCreateUserUUID = (): string => {
  try {
    fs.mkdirSync(ZETACHIAN_DIR, { recursive: true });
  } catch (err) {
    console.error(`Failed to ensure config directory: ${ZETACHIAN_DIR}`, err);
  }

  let data: any = {};
  let needsWrite = false;

  if (fs.existsSync(ZETACHAIN_CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(ZETACHAIN_CONFIG_FILE, "utf8");
      if (raw.trim()) data = JSON.parse(raw);
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

  return data.uuid;
};

export const setupAnalytics = (program: Command) => {
  const analytics = new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_ENDPOINT,
  });

  program.hook("preAction", async (_thisCommand, actionCommand) => {
    const event: EventMessage = {
      distinctId: getOrCreateUserUUID(),
      event: getFullCommandPath(actionCommand),
    };
    console.log(event);
    analytics.capture(event);

    await analytics.shutdown();
  });
};
