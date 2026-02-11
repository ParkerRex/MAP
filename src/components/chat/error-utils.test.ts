import { describe, expect, it } from "bun:test";
import { getErrorMessage } from "./error-utils";

describe("getErrorMessage", () => {
  it("returns Error.message when available", () => {
    const message = getErrorMessage(new Error("boom"), "fallback");

    expect(message).toBe("boom");
  });

  it("returns string errors directly", () => {
    const message = getErrorMessage("gateway failed", "fallback");

    expect(message).toBe("gateway failed");
  });

  it("returns fallback for unknown error shapes", () => {
    const message = getErrorMessage({ detail: "bad" }, "fallback");

    expect(message).toBe("fallback");
  });
});
