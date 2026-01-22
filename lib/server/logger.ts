/**
 * Logger utility that writes to both console and log file
 * File logging only works on server-side (Node.js environment)
 */

import fs from "fs";
import path from "path";

const LOGS_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOGS_DIR, "quiziai.log");
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure logs directory exists
function ensureLogsDir() {
  if (typeof window === "undefined" && !fs.existsSync(LOGS_DIR)) {
    try {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    } catch (error) {
      // Silently fail if we can't create directory
      console.error("Failed to create logs directory:", error);
    }
  }
}

// Check if log file needs rotation
function rotateLogIfNeeded() {
  if (typeof window !== "undefined") return; // Client-side, skip

  try {
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size > MAX_LOG_SIZE) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const rotatedFile = path.join(LOGS_DIR, `quiziai-${timestamp}.log`);
        fs.renameSync(LOG_FILE, rotatedFile);
        console.log(`📁 [LOGGER] Log rotated: ${rotatedFile}`);
      }
    }
  } catch (error) {
    // Silently fail rotation
  }
}

// Write to log file (server-side only)
function writeToFile(level: string, message: string) {
  if (typeof window !== "undefined") return; // Client-side, skip file logging

  try {
    ensureLogsDir();
    rotateLogIfNeeded();

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;

    fs.appendFileSync(LOG_FILE, logEntry, { encoding: "utf-8" });
  } catch (error) {
    // Silently fail file writing - don't break the app
    // Only log to console if file writing fails
    if (error instanceof Error && !error.message.includes("ENOENT")) {
      console.error("Failed to write to log file:", error.message);
    }
  }
}

// Format message for logging
function formatMessage(prefix: string, ...args: unknown[]): string {
  const parts = args.map((arg) => {
    if (typeof arg === "object" && arg !== null) {
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  });
  return `${prefix} ${parts.join(" ")}`;
}

/**
 * Log levels
 */
export const LogLevel = {
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  DEBUG: "DEBUG",
} as const;

/**
 * Logger interface
 */
export interface Logger {
  log: (prefix: string, ...args: unknown[]) => void;
  warn: (prefix: string, ...args: unknown[]) => void;
  error: (prefix: string, ...args: unknown[]) => void;
  debug: (prefix: string, ...args: unknown[]) => void;
}

/**
 * Create a logger instance
 */
export function createLogger(module: string): Logger {
  const modulePrefix = `[${module}]`;

  return {
    log: (prefix: string, ...args: unknown[]) => {
      const message = formatMessage(modulePrefix, prefix, ...args);
      console.log(message);
      writeToFile(LogLevel.INFO, message);
    },
    warn: (prefix: string, ...args: unknown[]) => {
      const message = formatMessage(modulePrefix, prefix, ...args);
      console.warn(message);
      writeToFile(LogLevel.WARN, message);
    },
    error: (prefix: string, ...args: unknown[]) => {
      const message = formatMessage(modulePrefix, prefix, ...args);
      console.error(message);
      writeToFile(LogLevel.ERROR, message);
    },
    debug: (prefix: string, ...args: unknown[]) => {
      const message = formatMessage(modulePrefix, prefix, ...args);
      console.debug(message);
      writeToFile(LogLevel.DEBUG, message);
    },
  };
}

/**
 * Default logger for general use
 */
export const logger = createLogger("APP");

/**
 * Get log file path (for reference)
 */
export function getLogFilePath(): string {
  return LOG_FILE;
}
