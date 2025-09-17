import { z } from "zod";

import {
  containsDangerousPatterns,
  sanitizeText,
} from "../../utils/validation";

// Ask command specific validation

const MAX_PROMPT_LENGTH = 8000;
const MIN_PROMPT_LENGTH = 1;

export const PromptSchema = z
  .string()
  .min(MIN_PROMPT_LENGTH, "Prompt cannot be empty")
  .max(
    MAX_PROMPT_LENGTH,
    `Prompt cannot exceed ${MAX_PROMPT_LENGTH} characters`,
  )
  .refine((prompt) => !containsDangerousPatterns(prompt), {
    message: "Prompt contains potentially unsafe content",
  });

export const validateAndSanitizePrompt = (input: string): string => {
  const sanitized = sanitizeText(input);
  const result = PromptSchema.safeParse(sanitized);

  if (!result.success) {
    throw new Error(`Invalid prompt: ${result.error.issues[0]?.message}`);
  }

  return result.data;
};
