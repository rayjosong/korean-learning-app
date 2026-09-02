export const PROVIDER_KEYS = [
  "openai-compatible",
  "claude_cli",
  "codex_cli",
  "antigravity_cli"
] as const;

export type ProviderKey = (typeof PROVIDER_KEYS)[number];
export type ProviderTransport = "api" | "cli";
export type ProviderSetupKind = "byok" | "cli_auth" | "experimental";

export type CliProviderStatus =
  | "not_installed"
  | "installed"
  | "ready"
  | "runtime_disabled"
  | "unreachable";

export interface ProviderCatalogEntry {
  key: ProviderKey;
  displayName: string;
  transport: ProviderTransport;
  setupKind: ProviderSetupKind;
  selectable: boolean;
  apiKeyRequired: boolean;
  runtimeEnabled: boolean;
  defaultExecutable?: string;
  bootstrapModelAliases: readonly string[];
}

export interface QualifiedModelReference {
  provider: ProviderKey;
  model: string;
  reference: string;
}

export const PROVIDER_CATALOG: Readonly<Record<ProviderKey, ProviderCatalogEntry>> = {
  "openai-compatible": {
    key: "openai-compatible",
    displayName: "OpenAI",
    transport: "api",
    setupKind: "byok",
    selectable: true,
    apiKeyRequired: true,
    runtimeEnabled: true,
    bootstrapModelAliases: ["gpt-4o-mini", "gpt-4o"]
  },
  claude_cli: {
    key: "claude_cli",
    displayName: "Claude Code",
    transport: "cli",
    setupKind: "cli_auth",
    selectable: true,
    apiKeyRequired: false,
    runtimeEnabled: true,
    defaultExecutable: "claude",
    bootstrapModelAliases: ["sonnet", "haiku", "opus"]
  },
  codex_cli: {
    key: "codex_cli",
    displayName: "Codex",
    transport: "cli",
    setupKind: "cli_auth",
    selectable: true,
    apiKeyRequired: false,
    runtimeEnabled: true,
    defaultExecutable: "codex",
    bootstrapModelAliases: ["gpt-5.6-codex", "gpt-5-codex"]
  },
  antigravity_cli: {
    key: "antigravity_cli",
    displayName: "Antigravity",
    transport: "cli",
    setupKind: "experimental",
    selectable: false,
    apiKeyRequired: false,
    runtimeEnabled: false,
    defaultExecutable: "agy",
    bootstrapModelAliases: []
  }
};

export function isProviderKey(value: string): value is ProviderKey {
  return (PROVIDER_KEYS as readonly string[]).includes(value);
}

export function isProviderSelectable(provider: ProviderKey): boolean {
  return PROVIDER_CATALOG[provider]?.selectable ?? false;
}

export function getProviderDisplayName(
  provider: ProviderKey,
  options?: { hasCustomBaseUrl?: boolean }
): string {
  if (provider === "openai-compatible") {
    return options?.hasCustomBaseUrl ? "OpenAI-compatible" : "OpenAI";
  }
  return PROVIDER_CATALOG[provider]?.displayName ?? provider;
}

export function formatProviderModelLabel(
  provider: ProviderKey,
  model: string,
  options?: { hasCustomBaseUrl?: boolean }
): string {
  const providerLabel = getProviderDisplayName(provider, options);
  return `${model} · ${providerLabel}`;
}

export function parseModelReference(reference: string): QualifiedModelReference {
  const trimmed = reference.trim();
  const separator = trimmed.indexOf(":");
  if (separator <= 0 || separator !== trimmed.lastIndexOf(":")) {
    throw new Error("Use a qualified provider:model reference.");
  }
  const provider = trimmed.slice(0, separator);
  const model = trimmed.slice(separator + 1).trim();
  if (!isProviderKey(provider)) throw new Error("Unknown AI provider.");
  if (!model) throw new Error("An AI provider model is required.");
  return { provider, model, reference: `${provider}:${model}` };
}

export function formatModelReference(provider: ProviderKey, model: string): string {
  if (!model.trim()) throw new Error("An AI provider model is required.");
  return `${provider}:${model.trim()}`;
}
