"use client";

import { useId, useState } from "react";
import type { AiProviderSettingsRecord, CliAiProvider } from "@/lib/ai-settings";
import type { PublicCliProbe } from "@/lib/provider-status";

export interface AiProviderRowProps {
  provider: CliAiProvider | "antigravity_cli";
  label: string;
  probe?: PublicCliProbe;
  path?: string;
  settings?: AiProviderSettingsRecord;
  isActive?: boolean;
  onSave?: (provider: CliAiProvider, model: string, andSelect?: boolean) => Promise<void> | void;
  onTest?: (provider: CliAiProvider) => Promise<{ ok: boolean; message: string }>;
  onEnabledChange?: (provider: CliAiProvider, enabled: boolean) => Promise<void> | void;
  bootstrapAliases?: readonly string[];
}

export function AiProviderRow({
  provider,
  label,
  probe,
  path,
  settings,
  isActive = false,
  onSave,
  onTest,
  onEnabledChange,
  bootstrapAliases = []
}: AiProviderRowProps) {
  const isAntigravity = provider === "antigravity_cli";
  const [isExpanded, setIsExpanded] = useState(false);
  const [model, setModel] = useState(
    settings?.model || (bootstrapAliases.length > 0 ? bootstrapAliases[0] : "")
  );
  const [testResult, setTestResult] = useState<{ ok?: boolean; message?: string }>();
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const modelInputId = useId();

  const isInstalled = probe?.status === "ready" || probe?.status === "installed";
  const isReady = probe?.status === "ready";
  const isDisabledBySetting = settings ? !settings.enabled : false;

  let statusLabel = "Unavailable";
  let statusColor = "text-ink-muted bg-surface-subtle";

  if (isAntigravity) {
    statusLabel = "Experimental — unavailable";
    statusColor = "text-ink-muted bg-surface-subtle";
  } else if (!probe || probe.status === "not_installed") {
    statusLabel = "Not installed";
    statusColor = "text-ink-muted bg-surface-subtle";
  } else if (isDisabledBySetting) {
    statusLabel = "Disabled";
    statusColor = "text-ink-muted bg-surface-subtle";
  } else if (isReady) {
    statusLabel = "Ready";
    statusColor = "text-jade-deep bg-jade-soft";
  } else if (probe.status === "runtime_disabled") {
    statusLabel = "Runtime disabled";
    statusColor = "text-ink-muted bg-surface-subtle";
  }

  async function handleTest() {
    if (!onTest || isAntigravity) return;
    setIsTesting(true);
    setTestResult(undefined);
    setErrorMessage(undefined);
    try {
      const res = await onTest(provider);
      setTestResult(res);
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : "Test failed." });
    } finally {
      setIsTesting(false);
    }
  }

  async function handleSave(andSelect = false) {
    if (!onSave || isAntigravity) return;
    const trimmedModel = model.trim();
    if (!trimmedModel) {
      setErrorMessage("Please enter a model name.");
      return;
    }
    setIsSaving(true);
    setErrorMessage(undefined);
    try {
      await onSave(provider, trimmedModel, andSelect);
      setIsExpanded(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      className="rounded-xl border border-hairline bg-surface-elevated p-4 transition-colors"
      aria-label={`${label} settings`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">{label}</h3>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor}`}>
              {statusLabel}
            </span>
            {isActive ? (
              <span className="inline-flex items-center rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary-deep">
                Active
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-ink-secondary">
            {settings?.model ? (
              <span>Model: <code className="font-mono text-ink">{settings.model}</code></span>
            ) : (
              <span>Not configured</span>
            )}
          </p>
        </div>

        {!isAntigravity ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              className="rounded-lg border border-hairline-strong px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-surface-subtle focus-visible:outline-primary"
            >
              {isExpanded ? "Done" : settings ? "Edit" : "Configure"}
            </button>
            {!isActive && isReady && settings?.enabled ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave(true)}
                className="rounded-lg bg-primary-hover px-2.5 py-1 text-xs font-medium text-on-primary transition hover:brightness-95 focus-visible:outline-primary disabled:opacity-50"
              >
                Use {label}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {isAntigravity ? (
        <div className="mt-3 text-xs leading-5 text-ink-muted">
          <p>Detected — runtime disabled pending security verification.</p>
          {path ? (
            <p className="mt-1 font-mono text-[11px] text-ink-muted">Path: {path}</p>
          ) : null}
        </div>
      ) : null}

      {isExpanded && !isAntigravity ? (
        <div className="mt-4 border-t border-hairline pt-4 space-y-4">
          <div>
            <label htmlFor={modelInputId} className="block text-xs font-medium text-ink-secondary">
              Model
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
              <input
                id={modelInputId}
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. sonnet"
                className="min-w-0 flex-1 rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {bootstrapAliases.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                <span>Suggested:</span>
                {bootstrapAliases.map((alias) => (
                  <button
                    key={alias}
                    type="button"
                    onClick={() => setModel(alias)}
                    className="rounded-md border border-hairline bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink-secondary hover:border-hairline-strong hover:text-ink"
                  >
                    {alias}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isTesting || !isInstalled}
                onClick={handleTest}
                className="rounded-lg border border-hairline-strong px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-surface-subtle focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isTesting ? "Testing…" : "Test connection"}
              </button>

              <button
                type="button"
                disabled={isSaving || !model.trim()}
                onClick={() => handleSave(isActive ? false : true)}
                className="rounded-lg bg-primary-hover px-3 py-1.5 text-xs font-medium text-on-primary transition hover:brightness-95 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isActive ? "Save changes" : `Use ${label}`}
              </button>
            </div>

            {settings ? (
              <label
                className={`flex items-center gap-1.5 text-xs ${
                  isActive ? "cursor-not-allowed text-ink-muted" : "cursor-pointer text-ink-secondary"
                }`}
                title={isActive ? "Cannot disable the active provider" : undefined}
              >
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  disabled={isActive}
                  onChange={(e) => {
                    if (onEnabledChange) {
                      void onEnabledChange(provider, e.target.checked);
                    }
                  }}
                  className="rounded border-hairline-strong text-primary focus:ring-primary"
                />
                <span>Enabled</span>
              </label>
            ) : null}
          </div>

          {testResult ? (
            <p
              role="status"
              className={`text-xs ${testResult.ok ? "text-jade-deep" : "text-error"}`}
            >
              {testResult.message}
            </p>
          ) : null}

          {errorMessage ? (
            <p role="alert" className="text-xs text-error">
              {errorMessage}
            </p>
          ) : null}

          <details className="mt-2 text-xs text-ink-muted">
            <summary className="cursor-pointer text-[11px] font-medium text-ink-secondary hover:text-ink">
              Details
            </summary>
            <div className="mt-2 space-y-1 rounded-lg border border-hairline bg-surface-subtle p-2.5 font-mono text-[11px]">
              {path ? <p>Executable: {path}</p> : <p>Executable: not found in PATH</p>}
              {probe?.version ? <p>Version: {probe.version}</p> : null}
              <p className="font-sans text-xs text-ink-muted pt-1">
                Uses the login of the OS user running the app server. Detection does not prove authentication.
              </p>
            </div>
          </details>
        </div>
      ) : null}
    </section>
  );
}
