import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const sourceDirectory = new URL("../src/", import.meta.url);
const prohibitedImports = /from\s+["'](?:next|react(?:\/[^"']*)?)["']|import\s+["'](?:next|react(?:\/[^"']*)?)["']/;
const failures = [];

for (const entry of await readdir(sourceDirectory, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
  const path = join(sourceDirectory.pathname, entry.name);
  const source = await readFile(path, "utf8");
  if (prohibitedImports.test(source)) failures.push(`${path}: domain source must not import UI libraries`);
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
