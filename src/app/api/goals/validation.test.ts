import { describe, expect, it } from "bun:test";
import { parseGoalCategory, parseGoalStatus } from "./validation";

describe("goals validation", () => {
  it("accepts known goal categories", () => {
    expect(parseGoalCategory("health")).toBe("health");
    expect(parseGoalCategory("work")).toBe("work");
    expect(parseGoalCategory("personal")).toBe("personal");
    expect(parseGoalCategory("family")).toBe("family");
    expect(parseGoalCategory("spiritual")).toBe("spiritual");
  });

  it("rejects unknown goal categories", () => {
    expect(parseGoalCategory("unknown")).toBeUndefined();
    expect(parseGoalCategory("HEALTH")).toBeUndefined();
    expect(parseGoalCategory(null)).toBeUndefined();
    expect(parseGoalCategory(42)).toBeUndefined();
  });

  it("accepts known goal statuses", () => {
    expect(parseGoalStatus("pending")).toBe("pending");
    expect(parseGoalStatus("in_progress")).toBe("in_progress");
    expect(parseGoalStatus("completed")).toBe("completed");
  });

  it("rejects unknown goal statuses", () => {
    expect(parseGoalStatus("done")).toBeUndefined();
    expect(parseGoalStatus("PENDING")).toBeUndefined();
    expect(parseGoalStatus(undefined)).toBeUndefined();
    expect(parseGoalStatus(false)).toBeUndefined();
  });
});
