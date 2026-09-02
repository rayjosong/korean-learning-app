import type { CliProviderStatus, ProviderCatalogEntry } from "@korean-learning/ai";

export interface PublicCliProbe {
  status: CliProviderStatus;
  version?: string;
  error?: string;
}

export interface ProviderStatusResponse {
  catalog: ProviderCatalogEntry[];
  detected_clis: Record<"claude_cli" | "codex_cli" | "antigravity_cli", boolean>;
  detected_cli_paths: Record<"claude_cli" | "codex_cli" | "antigravity_cli", string>;
  probes: Record<"claude_cli" | "codex_cli" | "antigravity_cli", PublicCliProbe>;
}

const cliKeys = ["claude_cli", "codex_cli", "antigravity_cli"] as const;
const statuses = new Set<CliProviderStatus>(["not_installed", "installed", "ready", "runtime_disabled", "unreachable"]);

export async function loadProviderStatus(request: typeof fetch = fetch): Promise<ProviderStatusResponse> {
  const response = await request("/api/model-config/providers", { cache: "no-store" });
  if (!response.ok) throw new Error("Provider status could not be loaded.");
  return parseProviderStatusResponse(await response.json());
}

export function parseProviderStatusResponse(value: unknown): ProviderStatusResponse {
  if (!isRecord(value) || !Array.isArray(value.catalog) || !isRecord(value.detected_clis) || !isRecord(value.detected_cli_paths) || !isRecord(value.probes)) {
    throw new Error("Provider status response is invalid.");
  }
  for (const key of cliKeys) {
    if (typeof value.detected_clis[key] !== "boolean" || typeof value.detected_cli_paths[key] !== "string") {
      throw new Error("Provider status response is invalid.");
    }
    const probe = value.probes[key];
    if (!isRecord(probe) || typeof probe.status !== "string" || !statuses.has(probe.status as CliProviderStatus)) {
      throw new Error("Provider status response is invalid.");
    }
  }
  return value as unknown as ProviderStatusResponse;
}

export interface ProviderValidationResult {
  ok: boolean;
  status:
    | "ready"
    | "needs_setup"
    | "not_installed"
    | "sign_in_required"
    | "auth_failed"
    | "unreachable"
    | "runtime_disabled";
  message: string;
  version?: string;
}

export async function validateProvider(
  provider: string,
  options: { apiKey?: string; baseUrl?: string } = {},
  request: typeof fetch = fetch
): Promise<ProviderValidationResult> {
  const response = await request("/api/model-config/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, ...options })
  });
  if (!response.ok) {
    try {
      const err = await response.json();
      if (isRecord(err) && typeof err.message === "string") {
        return {
          ok: false,
          status: (err.status as ProviderValidationResult["status"]) || "unreachable",
          message: err.message
        };
      }
    } catch {}
    return { ok: false, status: "unreachable", message: "Validation request failed." };
  }
  return response.json();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
