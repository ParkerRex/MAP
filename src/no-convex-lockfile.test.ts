import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const CONVEX_LOCK_RE = /(^|\n)\s*"(@convex-dev\/[^"]+|convex)"\s*:/m;

describe("convex lockfile guard", () => {
  it("does not include convex runtime packages in bun.lock", async () => {
    const lockfilePath = path.resolve(process.cwd(), "bun.lock");
    const lockfile = await readFile(lockfilePath, "utf8");

    const match = lockfile.match(CONVEX_LOCK_RE);
    expect(match?.[2] ?? null).toBeNull();
  });
});
