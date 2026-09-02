import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const sourceDirectory = new URL("../src/", import.meta.url);
const failures = [];

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return files(path);
    return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  }))).flat();
}

for (const path of await files(sourceDirectory.pathname)) {
  const source = await readFile(path, "utf8");
  if (/console\.(log|debug|info)\(/.test(source)) failures.push(`${path}: remove console output`);
  if (/\bany\b/.test(source)) failures.push(`${path}: avoid explicit any`);
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
