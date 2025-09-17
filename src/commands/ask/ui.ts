import { createSpinner, SpinnerController } from "../../utils/ui";

// Ask command specific UI elements

const CHAT_PHRASES = [
  "Untangling cosmic blockchains",
  "Consulting the oracle logs",
  "Herding universal contracts",
  "Tickling the Gateway gremlins",
  "Peering into quantum mempools",
  "Polishing chain abstractions",
  "Chasing runaway transactions",
  "Listening to validator whispers",
  "Feeding gas to the EVM dragons",
  "Baking fresh consensus pies",
  "Watering cross-chain bridges",
  "Teaching tokens new tricks",
  "Collecting stray opcodes",
  "Aligning interchain stars",
  "Summoning a clean response",
];

export const createChatSpinner = (): SpinnerController => {
  return createSpinner("Thinking...", CHAT_PHRASES);
};
