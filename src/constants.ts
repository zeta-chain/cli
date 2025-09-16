import os from "os";
import path from "path";

export const POSTHOG_API_KEY =
  "phc_y7X3IXJu9751SOeEsisUIo3pGDgo1jxJ6Fk7odUMWJ4";
export const POSTHOG_ENDPOINT = "https://us.i.posthog.com";

export const ZETACHAIN_DIR = path.join(os.homedir(), ".zetachain");
export const ZETACHAIN_CONFIG_FILE = path.join(ZETACHAIN_DIR, "config.json");

export const DEFAULT_CHAT_API_URL =
  "https://docs-v2-git-chat-api.zetachain.app/api/chat/";
export const DEFAULT_CHATBOT_ID = "HwoQ2Sf9rFFtdW59sbYKF";
export const MAX_RETRIES = 5;
export const BASE_DELAY_MS = 10000;
