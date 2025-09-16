import { z } from "zod";

// Ask command specific schemas for chat/AI APIs

export const StreamChoiceSchema = z.object({
  delta: z
    .object({
      content: z.string().optional(),
    })
    .optional(),
});

export const StreamResponseSchema = z.object({
  choices: z.array(StreamChoiceSchema).optional(),
});

export const TextResponseSchema = z.object({
  text: z.string(),
});

export const ErrorResponseSchema = z.object({
  error: z.string().optional(),
  message: z.string().optional(),
});
