import { PROVIDER_CATALOG, type CliProviderStatus, type ProviderKey } from "../provider-catalog.ts";
import { runCliProcess } from "./cli-process.ts";
import { resolveCliPath } from "./cli-path.ts";

export interface CliProbeResult {
  status: CliProviderStatus;
  path?: string;
  version?: string;
  models: readonly string[];
  error?: string;
}

export async function probeCliProvider(providerKey: ProviderKey): Promise<CliProbeResult> {
  const provider = PROVIDER_CATALOG[providerKey];
  if (provider.transport !== "cli") throw new Error("Only CLI providers can be probed.");
  const path = await resolveCliPath(providerKey);
  if (!path) return { status: "not_installed", models: [] };
  try {
    const result = await runCliProcess({
      executable: path,
      args: ["--version"],
      timeoutMs: Number(process.env.CLI_PROBE_TIMEOUT_MS) || 5_000,
      maxOutputBytes: 16_384
    });
    const version = result.stdout.trim().split(/\r?\n/, 1)[0] || undefined;
    return {
      status: provider.runtimeEnabled ? "ready" : "runtime_disabled",
      path,
      ...(version ? { version } : {}),
      models: provider.runtimeEnabled ? provider.bootstrapModelAliases : []
    };
  } catch {
    return { status: "unreachable", path, models: [], error: "The provider version check failed." };
  }
}
