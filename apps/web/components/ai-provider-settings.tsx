"use client";

import { useId, useState } from "react";
import { formatModelReference, parseModelReference } from "@korean-learning/ai";
import type { AiProviderSettingsRecord, AiSettings, CliAiProvider } from "@/lib/ai-settings";
import type { ProviderStatusResponse, ProviderValidationResult } from "@/lib/provider-status";
import { AiProviderRow } from "./ai-provider-row";
import { ModelPicker } from "./model-picker";

export interface AiProviderSettingsProps {
  settings: AiSettings;
  ready: boolean;
  saved: boolean;
  onChange: (settings: AiSettings) => void;
  onSave: (settings: AiSettings, andSelect?: boolean) => Promise<void> | void;
  onTest?: (settings: AiSettings) => Promise<ProviderValidationResult>;
  onRemove: () => Promise<void> | void;
  providerSettings?: AiProviderSettingsRecord[];
  providerStatus?: ProviderStatusResponse;
  selectedModel?: string;
  onSaveCli?: (provider: CliAiProvider, model: string, andSelect?: boolean) => Promise<void> | void;
  onTestCli?: (provider: CliAiProvider) => Promise<ProviderValidationResult>;
  onEnabledChange?: (provider: CliAiProvider, enabled: boolean) => Promise<void> | void;
  onSelectedModelChange?: (reference: string) => Promise<void> | void;
}

export function AiProviderSettings({
  settings,
  ready,
  saved,
  onChange,
  onSave,
  onTest,
  onRemove,
  providerSettings = [],
  providerStatus,
  selectedModel,
  onSaveCli,
  onTestCli,
  onEnabledChange,
  onSelectedModelChange
}: AiProviderSettingsProps) {
  const [isOpenAiExpanded, setIsOpenAiExpanded] = useState(false);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [isTestingOpenAi, setIsTestingOpenAi] = useState(false);
  const [openAiTestResult, setOpenAiTestResult] = useState<ProviderValidationResult>();
  const [isSavingOpenAi, setIsSavingOpenAi] = useState(false);
  const [openAiErrorMessage, setOpenAiErrorMessage] = useState<string>();

  const apiKeyInputId = useId();
  const modelInputId = useId();
  const baseUrlInputId = useId();

  const isOpenAiActive = (() => {
    if (!selectedModel) return false;
    try {
      return parseModelReference(selectedModel).provider === "openai-compatible";
    } catch {
      return false;
    }
  })();

  const hasApiKey = settings.apiKey.trim().length > 0;
  const hasModel = settings.model.trim().length > 0;
  const canSaveOpenAi = hasApiKey && hasModel;

  const openAiStatusLabel = (() => {
    if (!hasApiKey) return "Needs setup";
    if (openAiTestResult?.ok) return "Ready";
    if (openAiTestResult && !openAiTestResult.ok) {
      if (openAiTestResult.status === "auth_failed") return "Sign-in required";
      return "Can't connect";
    }
    return saved ? "Ready" : "Needs setup";
  })();

  const openAiStatusColor = (() => {
    if (openAiStatusLabel === "Ready") return "text-jade-deep bg-jade-soft";
    if (openAiStatusLabel === "Needs setup") return "text-ink-muted bg-surface-subtle";
    return "text-error bg-surface-subtle";
  })();

  async function handleTestOpenAi() {
    if (!onTest) return;
    setIsTestingOpenAi(true);
    setOpenAiTestResult(undefined);
    setOpenAiErrorMessage(undefined);
    try {
      const res = await onTest(settings);
      setOpenAiTestResult(res);
    } catch (err) {
      setOpenAiTestResult({
        ok: false,
        status: "unreachable",
        message: err instanceof Error ? err.message : "Connection test failed."
      });
    } finally {
      setIsTestingOpenAi(false);
    }
  }

  async function handleSaveOpenAi(andSelect = false) {
    if (!canSaveOpenAi) {
      setOpenAiErrorMessage("Add an API key and model before saving.");
      return;
    }
    setIsSavingOpenAi(true);
    setOpenAiErrorMessage(undefined);
    try {
      await onSave(settings, andSelect);
      setIsOpenAiExpanded(false);
    } catch (err) {
      setOpenAiErrorMessage(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setIsSavingOpenAi(false);
    }
  }

  async function handleRemoveOpenAi() {
    try {
      await onRemove();
      setIsConfirmingRemove(false);
      setIsOpenAiExpanded(false);
      setOpenAiTestResult(undefined);
    } catch (err) {
      setOpenAiErrorMessage(err instanceof Error ? err.message : "Failed to remove.");
    }
  }

  return (
    <div className="space-y-6" aria-label="AI provider settings">
      {/* 1. Active Model Picker */}
      <section
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-hairline bg-surface-elevated p-4"
        aria-label="Active explanation model"
      >
        <div>
          <h2 className="text-sm font-semibold text-ink">Active model</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            The qualified model used across Watch and Study explanations.
          </p>
        </div>

        {onSelectedModelChange ? (
          <ModelPicker
            settings={providerSettings}
            status={providerStatus}
            value={selectedModel}
            onChange={(ref) => void onSelectedModelChange(ref)}
            disabled={!ready}
          />
        ) : null}
      </section>

      {/* 2. Providers List */}
      <section className="space-y-3" aria-label="Configured AI providers">
        <h2 className="text-sm font-semibold text-ink">Providers</h2>

        {/* OpenAI Provider Row */}
        <div className="rounded-xl border border-hairline bg-surface-elevated p-4 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-ink">
                  {settings.baseUrl?.trim() ? "OpenAI-compatible" : "OpenAI"}
                </h3>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${openAiStatusColor}`}>
                  {openAiStatusLabel}
                </span>
                {isOpenAiActive ? (
                  <span className="inline-flex items-center rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary-deep">
                    Active
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-ink-secondary">
                {saved && settings.model ? (
                  <span>Model: <code className="font-mono text-ink">{settings.model}</code></span>
                ) : (
                  <span>BYOK OpenAI-compatible API</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpenAiExpanded((prev) => !prev)}
                aria-expanded={isOpenAiExpanded}
                className="rounded-lg border border-hairline-strong px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-surface-subtle focus-visible:outline-primary"
              >
                {isOpenAiExpanded ? "Done" : saved ? "Edit" : "Configure"}
              </button>

              {!isOpenAiActive && saved && canSaveOpenAi ? (
                <button
                  type="button"
                  disabled={isSavingOpenAi || !ready}
                  onClick={() => handleSaveOpenAi(true)}
                  className="rounded-lg bg-primary-hover px-2.5 py-1 text-xs font-medium text-on-primary transition hover:brightness-95 focus-visible:outline-primary disabled:opacity-50"
                >
                  Use OpenAI
                </button>
              ) : null}
            </div>
          </div>

          {isOpenAiExpanded ? (
            <div className="mt-4 border-t border-hairline pt-4 space-y-4">
              <div>
                <label htmlFor={apiKeyInputId} className="block text-xs font-medium text-ink-secondary">
                  API key
                </label>
                <input
                  id={apiKeyInputId}
                  type="password"
                  autoComplete="off"
                  value={settings.apiKey}
                  onChange={(e) => onChange({ ...settings, apiKey: e.target.value })}
                  placeholder="sk-…"
                  className="mt-1 w-full rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor={modelInputId} className="block text-xs font-medium text-ink-secondary">
                  Model
                </label>
                <input
                  id={modelInputId}
                  type="text"
                  value={settings.model}
                  onChange={(e) => onChange({ ...settings, model: e.target.value })}
                  placeholder="gpt-4o-mini"
                  className="mt-1 w-full rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <details className="text-xs text-ink-muted">
                <summary className="cursor-pointer text-[11px] font-medium text-ink-secondary hover:text-ink">
                  Advanced (custom base URL)
                </summary>
                <div className="mt-2">
                  <label htmlFor={baseUrlInputId} className="block text-xs font-medium text-ink-secondary">
                    Base URL <span className="text-ink-muted">(optional)</span>
                  </label>
                  <input
                    id={baseUrlInputId}
                    type="text"
                    value={settings.baseUrl ?? ""}
                    onChange={(e) => onChange({ ...settings, baseUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                    className="mt-1 w-full rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </details>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isTestingOpenAi || !hasApiKey}
                    onClick={handleTestOpenAi}
                    className="rounded-lg border border-hairline-strong px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-surface-subtle focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isTestingOpenAi ? "Testing…" : "Test connection"}
                  </button>

                  <button
                    type="button"
                    disabled={!ready || !canSaveOpenAi || isSavingOpenAi}
                    onClick={() => handleSaveOpenAi(!isOpenAiActive)}
                    className="rounded-lg bg-primary-hover px-3 py-1.5 text-xs font-medium text-on-primary transition hover:brightness-95 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isOpenAiActive ? "Save changes" : "Save and use"}
                  </button>
                </div>

                {saved ? (
                  <div>
                    {isConfirmingRemove ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-error">Remove key?</span>
                        <button
                          type="button"
                          onClick={handleRemoveOpenAi}
                          className="rounded-md bg-error px-2 py-1 text-xs font-medium text-white hover:brightness-95 focus-visible:outline-primary"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingRemove(false)}
                          className="rounded-md border border-hairline-strong px-2 py-1 text-xs text-ink-secondary hover:bg-surface-subtle"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={!ready}
                        onClick={() => setIsConfirmingRemove(true)}
                        className="rounded-lg border border-hairline-strong px-3 py-1.5 text-xs text-ink-secondary transition hover:border-error hover:text-error focus-visible:outline-primary disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ) : null}
              </div>

              {openAiTestResult ? (
                <p
                  role="status"
                  className={`text-xs ${openAiTestResult.ok ? "text-jade-deep" : "text-error"}`}
                >
                  {openAiTestResult.message}
                </p>
              ) : null}

              {openAiErrorMessage ? (
                <p role="alert" className="text-xs text-error">
                  {openAiErrorMessage}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* CLI Providers */}
        {(["claude_cli", "codex_cli", "antigravity_cli"] as const).map((cliKey) => {
          const isCliActive = (() => {
            if (!selectedModel) return false;
            try {
              return parseModelReference(selectedModel).provider === cliKey;
            } catch {
              return false;
            }
          })();

          const cliLabel =
            cliKey === "claude_cli"
              ? "Claude Code"
              : cliKey === "codex_cli"
              ? "Codex"
              : "Antigravity";

          const aliases =
            cliKey === "claude_cli"
              ? (["sonnet", "haiku", "opus"] as const)
              : cliKey === "codex_cli"
              ? (["gpt-5.6-codex", "gpt-5-codex"] as const)
              : [];

          return (
            <AiProviderRow
              key={cliKey}
              provider={cliKey}
              label={cliLabel}
              probe={providerStatus?.probes[cliKey]}
              path={providerStatus?.detected_cli_paths[cliKey]}
              settings={providerSettings.find((item) => item.provider === cliKey)}
              isActive={isCliActive}
              onSave={onSaveCli}
              onTest={onTestCli}
              onEnabledChange={onEnabledChange}
              bootstrapAliases={aliases}
            />
          );
        })}
      </section>

      {/* 3. Concise Local-Storage Notice */}
      <footer className="border-t border-hairline pt-3 text-xs leading-5 text-ink-muted">
        <p>
          Browser storage is local convenience, not a secure secret vault. Saved settings stay in this browser and are never exported. Remove keys on shared devices. CLI providers run locally on your machine.
        </p>
      </footer>
    </div>
  );
}
