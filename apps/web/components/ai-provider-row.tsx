"use client";

import type { CliAiProvider, AiProviderSettingsRecord } from "@/lib/ai-settings";
import type { PublicCliProbe } from "@/lib/provider-status";

export interface AiProviderRowProps {
  provider: CliAiProvider;
  label: string;
  probe: PublicCliProbe;
  path: string;
  settings?: AiProviderSettingsRecord;
  onSave: (provider: CliAiProvider, model: string) => void;
  onEnabledChange: (provider: CliAiProvider, enabled: boolean) => void;
}

export function AiProviderRow({ provider, label, probe, path, settings, onSave, onEnabledChange }: AiProviderRowProps) {
  const disabled = probe.status !== "ready";
  const experimental = probe.status === "runtime_disabled";
  const status = experimental ? "Experimental" : probe.status === "ready" ? "Ready" : probe.status === "not_installed" ? "Not installed" : "Unavailable";
  return (
    <section className="rounded-lg border border-hairline p-3" aria-label={`${label} settings`}>
      <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-medium text-ink">{label}</h3><span className="text-xs text-ink-muted">{status}</span></div>
      {experimental ? <p className="mt-2 text-xs text-ink-secondary">Detected - runtime disabled pending security verification</p> : null}
      {path ? <p className="mt-2 break-all font-mono text-xs text-ink-muted">{path}</p> : null}
      <p className="mt-2 text-xs leading-5 text-ink-muted">Uses the login of the OS user running the app server. Detection does not prove authentication.</p>
      {!experimental ? <div className="mt-3 flex gap-2">
        <input aria-label={`${label} model`} defaultValue={settings?.model ?? ""} placeholder="Model" disabled={disabled} onBlur={(event) => { if (event.target.value.trim()) onSave(provider, event.target.value); }} className="min-w-0 flex-1 rounded-lg border border-hairline-strong bg-surface-elevated px-2 py-1.5 text-sm text-ink disabled:opacity-50" />
        <label className="flex items-center gap-1 text-xs text-ink-secondary"><input type="checkbox" checked={settings?.enabled ?? false} disabled={disabled || !settings} onChange={(event) => onEnabledChange(provider, event.target.checked)} />Enabled</label>
      </div> : null}
    </section>
  );
}
