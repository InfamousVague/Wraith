/**
 * Live Browser Test Configuration
 *
 * These tests run SLOWLY and in HEADED mode so you can watch
 * every click, scroll, and validation in real-time.
 */

export const LIVE_TEST_CONFIG = {
  // Timing - slow enough to watch
  STEP_DELAY_MS: 1500,           // Pause between each action
  PAGE_LOAD_WAIT_MS: 3000,       // Wait for page to fully load
  ANIMATION_WAIT_MS: 500,        // Wait for animations
  API_TIMEOUT_MS: 10000,         // API call timeout

  // Visual
  HEADED: true,                   // Always show browser
  SLOW_MO: 100,                   // Slow down all actions by 100ms
  VIEWPORT: { width: 1440, height: 900 },

  // Screenshots
  SCREENSHOT_ON_STEP: true,       // Screenshot every step
  SCREENSHOT_DIR: './e2e/screenshots/live-run',

  // Logging
  LOG_LEVEL: 'verbose' as const,  // Log everything
  LOG_TO_FILE: true,
  LOG_DIR: './e2e/logs',

  // Validation
  STRICT_API_MATCH: true,         // Fail if UI doesn't match API
  TOLERANCE_PERCENT: 0.01,        // 1% tolerance for prices

  // URLs
  BASE_URL: process.env.BASE_URL || 'http://localhost:5173',
  API_URL: process.env.API_URL || 'http://localhost:4000',
} as const;

// Test suite step interface
export interface TestStep {
  id: string;
  description: string;
  screenshot?: string;
}

// Validation result interface
export interface ValidationResult {
  field: string;
  uiValue: unknown;
  apiValue: unknown;
  match: boolean;
  tolerance?: number;
  error?: string;
}

// Test suite result interface
export interface SuiteResult {
  name: string;
  steps: {
    id: string;
    description: string;
    passed: boolean;
    duration: number;
    screenshot?: string;
    validations?: ValidationResult[];
    error?: string;
  }[];
  totalSteps: number;
  passedSteps: number;
  duration: number;
  screenshots: string[];
}

export type LogLevel = 'verbose' | 'info' | 'warn' | 'error';
