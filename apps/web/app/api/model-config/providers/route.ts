import { PROVIDER_CATALOG, PROVIDER_KEYS } from "@korean-learning/ai";
import { probeCliProvider, type CliProbeResult } from "@korean-learning/ai/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cliKeys = ["claude_cli", "codex_cli", "antigravity_cli"] as const;

export async function GET(): Promise<Response> {
  return Response.json(await buildProviderStatus(), { headers: { "Cache-Control": "no-store" } });
}

export async function buildProviderStatus(
  probe: (key: (typeof cliKeys)[number]) => Promise<CliProbeResult> = probeCliProvider
) {
  const entries = await Promise.all(cliKeys.map(async (key) => [key, await probe(key)] as const));
  const probes = Object.fromEntries(entries) as Record<(typeof cliKeys)[number], CliProbeResult>;
  return {
    catalog: PROVIDER_KEYS.map((key) => ({ ...PROVIDER_CATALOG[key] })),
    detected_clis: Object.fromEntries(cliKeys.map((key) => [key, Boolean(probes[key].path)])) as Record<(typeof cliKeys)[number], boolean>,
    detected_cli_paths: Object.fromEntries(cliKeys.map((key) => [key, probes[key].path ?? ""])) as Record<(typeof cliKeys)[number], string>,
    probes: Object.fromEntries(cliKeys.map((key) => [key, publicProbe(probes[key])]))
  };
}

function publicProbe(probe: CliProbeResult) {
  return {
    status: probe.status,
    ...(probe.version ? { version: probe.version } : {}),
    ...(probe.error ? { error: probe.error } : {})
  };
}
