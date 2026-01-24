import { createLogger, logger, getLogFilePath, LogLevel } from "@/lib/server/logger";
import fs from "fs";

// Mock fs module
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  statSync: jest.fn(),
  renameSync: jest.fn(),
  appendFileSync: jest.fn(),
}));

// Mock path module
jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
  cwd: jest.fn(() => "/test"),
}));

// Mock window to be undefined (server-side)
const globalWithWindow = global as typeof globalThis & { window?: Window };
const originalWindow = globalWithWindow.window;
beforeAll(() => {
  delete globalWithWindow.window;
});
afterAll(() => {
  globalWithWindow.window = originalWindow;
});

describe("Logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete globalWithWindow.window;
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.statSync as jest.Mock).mockReturnValue({ size: 1000 });
  });

  it("should create a logger instance", () => {
    const testLogger = createLogger("TEST");
    expect(testLogger).toHaveProperty("log");
    expect(testLogger).toHaveProperty("warn");
    expect(testLogger).toHaveProperty("error");
    expect(testLogger).toHaveProperty("debug");
  });

  it("should log info messages", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    (fs.appendFileSync as jest.Mock).mockClear();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.statSync as jest.Mock).mockReturnValue({ size: 1000 });
    const testLogger = createLogger("TEST");

    testLogger.log("Test message", "arg1", "arg2");

    expect(consoleSpy).toHaveBeenCalled();
    expect(fs.appendFileSync).toHaveBeenCalled();
    const logCall = (fs.appendFileSync as jest.Mock).mock.calls[0]?.[1];
    if (logCall) {
      expect(logCall).toContain("Test message");
    }

    consoleSpy.mockRestore();
  });

  it("should log warning messages", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
    const testLogger = createLogger("TEST");

    testLogger.warn("Warning message");

    expect(consoleSpy).toHaveBeenCalled();
    expect(fs.appendFileSync).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should log error messages", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const testLogger = createLogger("TEST");

    testLogger.error("Error message");

    expect(consoleSpy).toHaveBeenCalled();
    expect(fs.appendFileSync).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should log debug messages", () => {
    const consoleSpy = jest.spyOn(console, "debug").mockImplementation();
    const testLogger = createLogger("TEST");

    testLogger.debug("Debug message");

    expect(consoleSpy).toHaveBeenCalled();
    expect(fs.appendFileSync).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should create logs directory if it doesn't exist", () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    const testLogger = createLogger("TEST");

    testLogger.log("Test");

    expect(fs.mkdirSync).toHaveBeenCalled();
  });

  it("should rotate log file when size exceeds limit", () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.statSync as jest.Mock).mockReturnValue({ size: 11 * 1024 * 1024 }); // > 10MB
    (fs.renameSync as jest.Mock).mockClear();
    const testLogger = createLogger("TEST");

    testLogger.log("Test");

    expect(fs.renameSync).toHaveBeenCalled();
  });

  it("should format objects as JSON in logs", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    (fs.appendFileSync as jest.Mock).mockClear();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.statSync as jest.Mock).mockReturnValue({ size: 1000 });
    const testLogger = createLogger("TEST");
    const testObj = { key: "value", number: 123 };

    testLogger.log("Test", testObj);

    const logCall = (fs.appendFileSync as jest.Mock).mock.calls[0]?.[1];
    if (logCall) {
      expect(logCall).toContain(JSON.stringify(testObj));
    }

    consoleSpy.mockRestore();
  });

  it("should return log file path", () => {
    const logPath = getLogFilePath();
    expect(logPath).toContain("logs");
    expect(logPath).toContain("quiziai.log");
  });

  it("should handle file write errors gracefully", () => {
    (fs.appendFileSync as jest.Mock).mockImplementation(() => {
      throw new Error("Write error");
    });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    const testLogger = createLogger("TEST");

    // Should not throw
    expect(() => testLogger.log("Test")).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled(); // Console log should still work

    consoleSpy.mockRestore();
  });

  it("should use default logger", () => {
    expect(logger).toBeDefined();
    expect(logger.log).toBeDefined();
  });
});
