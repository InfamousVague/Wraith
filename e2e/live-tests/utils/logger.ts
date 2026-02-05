/**
 * Live Test Logger
 *
 * Provides beautiful console output for watchable test runs.
 * Logs to both console and file for later review.
 */

import { LIVE_TEST_CONFIG, LogLevel, ValidationResult, SuiteResult } from '../config';
import * as fs from 'fs';
import * as path from 'path';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

// Symbols for visual clarity
const symbols = {
  check: '✅',
  cross: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  camera: '📸',
  pin: '📍',
  chart: '📊',
  celebration: '🎉',
  rocket: '🚀',
  clock: '⏱️',
  folder: '📁',
  arrow: '→',
  bullet: '•',
};

class LiveTestLogger {
  private logFile: string | null = null;
  private startTime: number = Date.now();
  private currentSuite: string = '';

  constructor() {
    if (LIVE_TEST_CONFIG.LOG_TO_FILE) {
      this.initLogFile();
    }
  }

  private initLogFile(): void {
    const logDir = LIVE_TEST_CONFIG.LOG_DIR;
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(logDir, `live-test-${timestamp}.log`);
  }

  private write(message: string, toFile = true): void {
    console.log(message);

    if (toFile && this.logFile) {
      // Strip ANSI codes for file output
      const plainMessage = message.replace(/\x1b\[[0-9;]*m/g, '');
      fs.appendFileSync(this.logFile, plainMessage + '\n');
    }
  }

  // Print the test suite header banner
  banner(title: string): void {
    const line = '═'.repeat(65);
    const timestamp = new Date().toLocaleString();

    this.write('');
    this.write(`${colors.cyan}${line}${colors.reset}`);
    this.write(`${colors.bold}  LIVE BROWSER TEST SUITE - ${title}${colors.reset}`);
    this.write(`  Started: ${timestamp}`);
    this.write(`  Mode: Headed (Watchable)`);
    this.write(`${colors.cyan}${line}${colors.reset}`);
    this.write('');

    this.startTime = Date.now();
  }

  // Start a new test suite
  suiteStart(name: string): void {
    this.currentSuite = name;
    const line = '─'.repeat(61);

    this.write('');
    this.write(`${colors.yellow}${symbols.pin} Suite: ${name}${colors.reset}`);
    this.write(`${colors.dim}${line}${colors.reset}`);
  }

  // Log a step starting
  stepStart(stepId: string, description: string): void {
    this.write(`  ${colors.dim}[${stepId}]${colors.reset} ${description}...`);
  }

  // Log a step completed successfully
  stepPass(stepId: string, duration?: number, extra?: string): void {
    const durationStr = duration ? ` ${colors.dim}(${(duration / 1000).toFixed(1)}s)${colors.reset}` : '';
    const extraStr = extra ? `\n        ${colors.dim}${extra}${colors.reset}` : '';
    this.write(`  ${colors.dim}[${stepId}]${colors.reset} ${symbols.check}${durationStr}${extraStr}`);
  }

  // Log a step failed
  stepFail(stepId: string, error: string): void {
    this.write(`  ${colors.dim}[${stepId}]${colors.reset} ${symbols.cross} ${colors.red}FAILED${colors.reset}`);
    this.write(`        ${colors.red}${error}${colors.reset}`);
  }

  // Log a screenshot taken
  screenshot(filename: string): void {
    this.write(`        ${symbols.camera} Screenshot: ${colors.cyan}${filename}${colors.reset}`);
  }

  // Log validation results
  validation(result: ValidationResult): void {
    const status = result.match ? symbols.check : symbols.cross;
    const color = result.match ? colors.green : colors.red;

    if (result.tolerance !== undefined) {
      this.write(`        ${status} ${result.field}: ${color}${result.uiValue}${colors.reset} ${colors.dim}(API: ${result.apiValue}, diff: ${result.tolerance.toFixed(3)}%)${colors.reset}`);
    } else {
      this.write(`        ${status} ${result.field}: ${color}${result.uiValue}${colors.reset}`);
    }
  }

  // Log multiple validations summary
  validationSummary(results: ValidationResult[]): void {
    const passed = results.filter(r => r.match).length;
    const total = results.length;
    const status = passed === total ? symbols.check : symbols.warning;

    this.write(`        ${status} ${passed}/${total} validations passed`);
  }

  // Log suite completion
  suiteEnd(result: SuiteResult): void {
    const percent = Math.round((result.passedSteps / result.totalSteps) * 100);
    const status = percent === 100 ? colors.green : colors.yellow;

    this.write('');
    this.write(`${symbols.chart} ${colors.bold}${result.name} Results:${colors.reset} ${status}${result.passedSteps}/${result.totalSteps} passed (${percent}%)${colors.reset}`);
    this.write(`   Duration: ${(result.duration / 1000).toFixed(1)} seconds`);
    this.write(`   Screenshots: ${result.screenshots.length}`);
    this.write('');
  }

  // Log final summary
  finalSummary(suites: SuiteResult[]): void {
    const line = '═'.repeat(65);
    const totalSteps = suites.reduce((sum, s) => sum + s.totalSteps, 0);
    const passedSteps = suites.reduce((sum, s) => sum + s.passedSteps, 0);
    const totalScreenshots = suites.reduce((sum, s) => sum + s.screenshots.length, 0);
    const totalDuration = Date.now() - this.startTime;
    const allPassed = passedSteps === totalSteps;

    this.write('');
    this.write(`${colors.cyan}${line}${colors.reset}`);
    this.write('');
    this.write(`${allPassed ? symbols.celebration : symbols.warning} ${colors.bold}ALL TESTS ${allPassed ? 'COMPLETED' : 'FINISHED WITH FAILURES'}${colors.reset}`);
    this.write(`${colors.dim}${'─'.repeat(61)}${colors.reset}`);
    this.write(`  Total Suites: ${suites.length}`);
    this.write(`  Total Steps: ${totalSteps}`);
    this.write(`  Passed: ${passedSteps} ${allPassed ? colors.green : colors.yellow}(${Math.round(passedSteps / totalSteps * 100)}%)${colors.reset}`);
    this.write(`  Failed: ${totalSteps - passedSteps}`);
    this.write(`  Duration: ${this.formatDuration(totalDuration)}`);
    this.write(`  Screenshots: ${totalScreenshots}`);
    this.write('');

    if (this.logFile) {
      this.write(`  ${symbols.folder} Log: ${this.logFile}`);
    }
    this.write(`  ${symbols.folder} Screenshots: ${LIVE_TEST_CONFIG.SCREENSHOT_DIR}`);
    this.write('');
    this.write(`${colors.cyan}${line}${colors.reset}`);
    this.write('');
  }

  // Helper to format duration
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  // Log info message
  info(message: string): void {
    if (LIVE_TEST_CONFIG.LOG_LEVEL === 'verbose' || LIVE_TEST_CONFIG.LOG_LEVEL === 'info') {
      this.write(`  ${symbols.info} ${message}`);
    }
  }

  // Log warning
  warn(message: string): void {
    this.write(`  ${symbols.warning} ${colors.yellow}${message}${colors.reset}`);
  }

  // Log error
  error(message: string): void {
    this.write(`  ${symbols.cross} ${colors.red}${message}${colors.reset}`);
  }

  // Log verbose message
  verbose(message: string): void {
    if (LIVE_TEST_CONFIG.LOG_LEVEL === 'verbose') {
      this.write(`        ${colors.dim}${message}${colors.reset}`);
    }
  }
}

// Export singleton instance
export const logger = new LiveTestLogger();
