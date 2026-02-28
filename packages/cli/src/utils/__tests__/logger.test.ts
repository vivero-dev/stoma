import { afterEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "../logger.js";

describe("createLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("verbose = false", () => {
    it("info calls console.log", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      const log = createLogger(false);
      log.info("hello");
      expect(spy).toHaveBeenCalledWith("hello");
    });

    it("error calls console.error", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const log = createLogger(false);
      log.error("bad");
      expect(spy).toHaveBeenCalledWith("bad");
    });

    it("verbose is a no-op", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      const log = createLogger(false);
      log.verbose("should not appear");
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("verbose = true", () => {
    it("verbose calls console.log", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      const log = createLogger(true);
      log.verbose("detail");
      expect(spy).toHaveBeenCalledWith("detail");
    });

    it("info still calls console.log", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      const log = createLogger(true);
      log.info("hello");
      expect(spy).toHaveBeenCalledWith("hello");
    });

    it("error still calls console.error", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const log = createLogger(true);
      log.error("bad");
      expect(spy).toHaveBeenCalledWith("bad");
    });
  });

  it("passes messages through without modification", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const log = createLogger(false);
    log.info("exact message content");
    expect(spy).toHaveBeenCalledWith("exact message content");
  });

  it("handles empty strings", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const log = createLogger(false);
    log.info("");
    expect(spy).toHaveBeenCalledWith("");
  });
});
