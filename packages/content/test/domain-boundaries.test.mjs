import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const packageRoot = new URL("..", import.meta.url);
const repositoryRoot = new URL("../../..", import.meta.url);
const packageNames = ["content", "korean", "learning-engine"];
const prohibitedImports = /from\s+["'](?:next|react(?:\/[^"']*)?)["']|import\s+["'](?:next|react(?:\/[^"']*)?)["']/;

test("domain packages expose models without UI dependencies", async () => {
  for (const packageName of packageNames) {
    const packageDirectory = join(repositoryRoot.pathname, "packages", packageName);
    const manifest = JSON.parse(await readFile(join(packageDirectory, "package.json"), "utf8"));
    assert.equal(manifest.exports["."], "./src/index.ts");
    assert.equal(manifest.dependencies, undefined);

    for (const entry of await readdir(join(packageDirectory, "src"))) {
      if (!entry.endsWith(".ts")) continue;
      const source = await readFile(join(packageDirectory, "src", entry), "utf8");
      assert.doesNotMatch(source, prohibitedImports, `${packageName}/${entry} imports a UI library`);
    }
  }

  assert.ok(packageRoot);
});
