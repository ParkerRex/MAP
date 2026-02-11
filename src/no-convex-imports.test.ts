import { describe, expect, it } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const PACKAGE_SPEC_RE = /["'](?:@convex-dev|convex)(?:\/[^"']*)?["']/;
const STATIC_IMPORT_RE =
  /\bimport\s+(?:type\s+)?[\s\S]*?\bfrom\s+["'](?:@convex-dev|convex)(?:\/[^"']*)?["']/m;
const EXPORT_FROM_RE = /\bexport\s+[\s\S]*?\bfrom\s+["'](?:@convex-dev|convex)(?:\/[^"']*)?["']/m;
const DYNAMIC_IMPORT_RE = /\bimport\s*\(\s*["'](?:@convex-dev|convex)(?:\/[^"']*)?["']\s*\)/m;
const REQUIRE_RE = /\brequire\s*\(\s*["'](?:@convex-dev|convex)(?:\/[^"']*)?["']\s*\)/m;
const RUNTIME_DEP_RE = /^(?:@convex-dev\/|convex$)/;

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
      if (
        PACKAGE_SPEC_RE.test(content) &&
        (STATIC_IMPORT_RE.test(content) ||
          EXPORT_FROM_RE.test(content) ||
          DYNAMIC_IMPORT_RE.test(content) ||
          REQUIRE_RE.test(content))
      ) {
        offenders.push(path.relative(process.cwd(), file));
      }
    }

    expect(offenders).toEqual([]);
  });

  it("does not include convex runtime dependencies in package.json", async () => {
    const packageJsonPath = path.resolve(process.cwd(), "package.json");
    const packageJsonRaw = await readFile(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonRaw) as {
      dependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };

    const runtimeDeps = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.optionalDependencies ?? {}),
      ...(packageJson.peerDependencies ?? {}),
    };

    const offenders = Object.keys(runtimeDeps)
      .filter((name) => RUNTIME_DEP_RE.test(name))
      .sort();

    expect(offenders).toEqual([]);
  });
});
