import { access } from "node:fs/promises";
import { delimiter, isAbsolute, join, resolve } from "node:path";

import { PROVIDER_CATALOG, type ProviderKey } from "../provider-catalog.ts";

const PATH_OVERRIDE_NAMES: Partial<Record<ProviderKey, string>> = {
  claude_cli: "CLAUDE_CLI_PATH",
  codex_cli: "CODEX_CLI_PATH",
  antigravity_cli: "ANTIGRAVITY_CLI_PATH"
};

export async function resolveCliPath(providerKey: ProviderKey): Promise<string | undefined> {
  const catalog = PROVIDER_CATALOG[providerKey];
  if (catalog.transport !== "cli" || !catalog.defaultExecutable) return undefined;

  const override = PATH_OVERRIDE_NAMES[providerKey];
  if (override && process.env[override]?.trim()) {
    const candidate = resolve(process.env[override].trim());
    return (await isExecutable(candidate)) ? candidate : undefined;
  }

  const paths = process.env.PATH?.split(delimiter).filter(Boolean) ?? [];
  for (const directory of paths) {
    const candidate = isAbsolute(catalog.defaultExecutable)
      ? catalog.defaultExecutable
      : join(directory, catalog.defaultExecutable);
    if (await isExecutable(candidate)) return resolve(candidate);
  }
  return undefined;
}

async function isExecutable(path: string): Promise<boolean> {
  try {
    await access(path, process.platform === "win32" ? undefined : 1);
    return true;
  } catch {
    return false;
  }
}
