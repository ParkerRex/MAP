import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

type TsConfigShape = {
  include?: string[];
  exclude?: string[];
};

describe("active typecheck scope guard", () => {
  it("keeps legacy convex code outside active tsconfig scope", async () => {
    const tsconfigPath = path.resolve(process.cwd(), "tsconfig.json");
    const raw = await readFile(tsconfigPath, "utf8");
    const tsconfig = JSON.parse(raw) as TsConfigShape;
    const include = tsconfig.include ?? [];
    const exclude = tsconfig.exclude ?? [];

    expect(include).toContain("src/**/*.ts");
    expect(include).toContain("src/**/*.tsx");
    expect(include).not.toContain("**/*.ts");
    expect(include).not.toContain("**/*.tsx");

    expect(exclude).toContain("convex");
    expect(exclude).toContain(".next/dev");
  });
});
