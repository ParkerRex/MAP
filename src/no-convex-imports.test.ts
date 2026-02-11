import { describe, expect, it } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const IMPORT_RE = /\bfrom\s+["'](?:@convex-dev|convex)(?:\/[^"']*)?["']/;

async function collectSourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx"))) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("convex migration guard", () => {
  it("does not import convex packages from src runtime code", async () => {
    const files = await collectSourceFiles(path.resolve(process.cwd(), "src"));
    const offenders: string[] = [];

    for (const file of files) {
      const content = await readFile(file, "utf8");
      if (IMPORT_RE.test(content)) {
        offenders.push(path.relative(process.cwd(), file));
      }
    }

    expect(offenders).toEqual([]);
  });
});
