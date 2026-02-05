/**
 * Username Validation Utilities
 *
 * Client-side username validation and moderation utilities.
 * Provides immediate feedback before server validation.
 */

export type UsernameErrorCode =
  | "TOO_SHORT"
  | "TOO_LONG"
  | "INVALID_CHARACTERS"
  | "STARTS_WITH_NUMBER"
  | "CONSECUTIVE_SPECIAL_CHARS"
  | "PROFANITY_DETECTED"
  | "RESERVED_USERNAME"
  | "HOMOGLYPH_DETECTED"
  | "ALREADY_TAKEN"
  | "RATE_LIMITED";

export type UsernameValidationResult = {
  isValid: boolean;
  error?: string;
  errorCode?: UsernameErrorCode;
  normalized?: string;
  suggestions?: string[];
};

export type UsernameConfig = {
  minLength: number;
  maxLength: number;
  allowedSpecialChars: string[];
};

const DEFAULT_CONFIG: UsernameConfig = {
  minLength: 3,
  maxLength: 20,
  allowedSpecialChars: ["_", "-", "."],
};

// Homoglyph mappings (characters that look similar)
const HOMOGLYPH_MAP: Record<string, string> = {
  "0": "o",
  "1": "l",
  "3": "e",
  "4": "a",
  "5": "s",
  "6": "b",
  "7": "t",
  "8": "b",
  "9": "g",
  "@": "a",
  $: "s",
  "!": "i",
  "|": "l",
  "(": "c",
  ")": "d",
  // Cyrillic lookalikes
  а: "a",
  е: "e",
  о: "o",
  р: "p",
  с: "c",
  х: "x",
  у: "y",
};

// Basic profanity list (extend as needed for production)
const PROFANITY_PATTERNS = [
  // Pattern-based detection for common bypasses
  /f+u+c+k+/i,
  /s+h+i+t+/i,
  /a+s+s+h+o+l+e+/i,
  /b+i+t+c+h+/i,
  /d+a+m+n+/i,
  /c+u+n+t+/i,
  /n+i+g+g+/i,
  /f+a+g+/i,
  /r+e+t+a+r+d+/i,
];

// Reserved usernames that cannot be taken
const RESERVED_USERNAMES = new Set([
  // System accounts
  "admin",
  "administrator",
  "root",
  "system",
  "bot",
  "api",
  "support",
  "help",
  "info",
  "contact",
  "abuse",
  "security",
  "moderator",
  "mod",
  "official",
  "staff",
  "team",
  // Brand protection
  "wraith",
  "haunt",
  "ghost",
  "phantom",
  // Common reserved
  "null",
  "undefined",
  "none",
  "void",
  "test",
  "demo",
  "example",
  "sample",
  "guest",
  "anonymous",
  "anon",
  // Service accounts
  "noreply",
  "no-reply",
  "mailer",
  "postmaster",
  "webmaster",
]);

/**
 * Normalize a username for comparison.
 */
export function normalizeUsername(username: string): string {
  let normalized = username.toLowerCase();

  // Replace homoglyphs
  for (const [lookalike, base] of Object.entries(HOMOGLYPH_MAP)) {
    normalized = normalized.split(lookalike).join(base);
  }

  // Remove special characters for comparison
  return normalized.replace(/[^a-z0-9]/g, "");
}

/**
 * Check if username contains profanity.
 */
export function containsProfanity(username: string): boolean {
  const normalized = normalizeUsername(username);

  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if username is reserved.
 */
export function isReservedUsername(username: string): boolean {
  const normalized = normalizeUsername(username);
  return RESERVED_USERNAMES.has(normalized);
}

/**
 * Detect homoglyph attacks (mixing character sets).
 */
export function detectHomoglyphAttack(username: string): boolean {
  let hasAscii = false;
  let hasNonAscii = false;

  for (const char of username) {
    const code = char.charCodeAt(0);

    if (code >= 0x41 && code <= 0x5a) {
      // A-Z
      hasAscii = true;
    } else if (code >= 0x61 && code <= 0x7a) {
      // a-z
      hasAscii = true;
    } else if (code >= 0x30 && code <= 0x39) {
      // 0-9
      hasAscii = true;
    } else if (/\p{L}/u.test(char) || /\p{N}/u.test(char)) {
      // Other letters/numbers (non-ASCII)
      hasNonAscii = true;
    }

    // Mixed scripts are suspicious
    if (hasAscii && hasNonAscii) {
      return true;
    }
  }

  return false;
}

/**
 * Validate a username client-side.
 */
export function validateUsername(
  username: string,
  config: Partial<UsernameConfig> = {}
): UsernameValidationResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const normalized = normalizeUsername(username);

  // Length check
  if (username.length < cfg.minLength) {
    return {
      isValid: false,
      error: `Username must be at least ${cfg.minLength} characters`,
      errorCode: "TOO_SHORT",
      normalized,
      suggestions: generateSuggestions(normalized, cfg),
    };
  }

  if (username.length > cfg.maxLength) {
    return {
      isValid: false,
      error: `Username must be at most ${cfg.maxLength} characters`,
      errorCode: "TOO_LONG",
      normalized,
      suggestions: generateSuggestions(normalized.slice(0, cfg.maxLength), cfg),
    };
  }

  // First character check
  if (/^[0-9]/.test(username)) {
    return {
      isValid: false,
      error: "Username cannot start with a number",
      errorCode: "STARTS_WITH_NUMBER",
      normalized,
      suggestions: generateSuggestions(normalized, cfg),
    };
  }

  // Character validation
  const allowedCharsRegex = new RegExp(
    `^[a-zA-Z0-9${cfg.allowedSpecialChars.map(escapeRegex).join("")}]+$`
  );
  if (!allowedCharsRegex.test(username)) {
    const invalidChar = username
      .split("")
      .find(
        (c) =>
          !/[a-zA-Z0-9]/.test(c) && !cfg.allowedSpecialChars.includes(c)
      );
    return {
      isValid: false,
      error: `Username contains invalid character: ${invalidChar}`,
      errorCode: "INVALID_CHARACTERS",
      normalized,
      suggestions: generateSuggestions(normalized, cfg),
    };
  }

  // Consecutive special characters
  const specialCharsPattern = new RegExp(
    `[${cfg.allowedSpecialChars.map(escapeRegex).join("")}]{2,}`
  );
  if (specialCharsPattern.test(username)) {
    return {
      isValid: false,
      error: "Username cannot have consecutive special characters",
      errorCode: "CONSECUTIVE_SPECIAL_CHARS",
      normalized,
      suggestions: generateSuggestions(normalized, cfg),
    };
  }

  // Reserved username check
  if (isReservedUsername(username)) {
    return {
      isValid: false,
      error: "This username is reserved",
      errorCode: "RESERVED_USERNAME",
      normalized,
      suggestions: generateSuggestions(normalized, cfg),
    };
  }

  // Profanity check
  if (containsProfanity(username)) {
    return {
      isValid: false,
      error: "Username contains inappropriate content",
      errorCode: "PROFANITY_DETECTED",
      normalized,
      suggestions: [],
    };
  }

  // Homoglyph attack detection
  if (detectHomoglyphAttack(username)) {
    return {
      isValid: false,
      error: "Username contains confusing characters",
      errorCode: "HOMOGLYPH_DETECTED",
      normalized,
      suggestions: generateSuggestions(normalized, cfg),
    };
  }

  return {
    isValid: true,
    normalized,
  };
}

/**
 * Generate username suggestions based on a base name.
 */
export function generateSuggestions(
  base: string,
  config: Partial<UsernameConfig> = {}
): string[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const suggestions: string[] = [];
  const suffixes = ["_", "1", "2", "x", "_x", "99", "00"];

  for (const suffix of suffixes) {
    const suggestion = base + suffix;
    if (
      suggestion.length <= cfg.maxLength &&
      !isReservedUsername(suggestion) &&
      !containsProfanity(suggestion)
    ) {
      suggestions.push(suggestion);
      if (suggestions.length >= 3) break;
    }
  }

  return suggestions;
}

/**
 * Escape special regex characters.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Hook for real-time username validation with debouncing.
 */
export function createUsernameValidator(debounceMs: number = 300) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function validateWithDebounce(
    username: string,
    callback: (result: UsernameValidationResult) => void
  ): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      const result = validateUsername(username);
      callback(result);
    }, debounceMs);
  };
}

export default {
  validateUsername,
  normalizeUsername,
  containsProfanity,
  isReservedUsername,
  detectHomoglyphAttack,
  generateSuggestions,
  createUsernameValidator,
};
