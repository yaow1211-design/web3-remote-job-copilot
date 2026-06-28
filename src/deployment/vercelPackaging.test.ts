import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("Vercel packaging", () => {
  it("keeps serverless runtime imports compatible with Vercel's Node ESM runtime", () => {
    const runtimeFiles = ["api/discover-jobs.ts", "src/domain/jobDiscovery.ts"];
    const extensionlessRuntimeImports = runtimeFiles.flatMap((path) => {
      const content = readProjectFile(path);
      const matches = [...content.matchAll(/import\s+(?!type\b)[^;]+from\s+"(\.{1,2}\/[^"]+)"/g)];

      return matches
        .map((match) => match[1])
        .filter((source) => !source.endsWith(".js"))
        .map((source) => `${path}: ${source}`);
    });

    expect(extensionlessRuntimeImports).toEqual([]);
  });

  it("does not publish test files as serverless functions", () => {
    const vercelIgnore = readProjectFile(".vercelignore");

    expect(vercelIgnore).toContain("**/*.test.ts");
  });
});
