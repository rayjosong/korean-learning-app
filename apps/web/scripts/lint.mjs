import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const sourceRoot = new URL("../", import.meta.url);
const sourceExtensions = new Set([".ts", ".tsx"]);
const failures = [];

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && !["node_modules", ".next"].includes(entry.name)) await inspect(path);
    else if (entry.isFile() && sourceExtensions.has(entry.name.slice(entry.name.lastIndexOf(".")))) {
      const content = await readFile(path, "utf8");
      if (/console\.(log|debug|info)\(/.test(content)) failures.push(`${path}: remove console output`);
      if (/\bany\b/.test(content)) failures.push(`${path}: avoid explicit any`);
    }
  }
}

await inspect(sourceRoot.pathname);
if (failures.length > 0) { console.error(failures.join("\n")); process.exitCode = 1; }
