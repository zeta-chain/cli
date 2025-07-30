import { deployCommand } from "./deploy";

// Export commands array for dynamic loading by the CLI
export default {
  commands: [deployCommand],
};
