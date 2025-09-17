// Highly reusable input validation utilities

export const sanitizeText = (input: string): string => {
  // Trim whitespace and normalize
  let sanitized = input.trim();

  // Remove null bytes and control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Limit consecutive whitespace
  sanitized = sanitized.replace(/\s{3,}/g, "  ");

  return sanitized;
};

export const containsDangerousPatterns = (input: string): boolean => {
  const dangerousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /@import/i,
  ];
  return dangerousPatterns.some((pattern) => pattern.test(input));
};

export const validateTextLength = (
  input: string,
  minLength: number = 1,
  maxLength: number = 8000,
): { error?: string; valid: boolean } => {
  if (input.length < minLength) {
    return { error: "Input cannot be empty", valid: false };
  }
  if (input.length > maxLength) {
    return {
      error: `Input cannot exceed ${maxLength} characters`,
      valid: false,
    };
  }
  return { valid: true };
};
