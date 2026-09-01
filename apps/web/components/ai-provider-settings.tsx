"use client";

import React, { useEffect, useState } from "react";
import { ExplanationDatabase } from "@korean-learning/storage";
import {
  loadAiProviderSettingsRecord,
  removeProfile,
  saveProfile,
  saveTaskRoute,
  PROVIDER_DEFAULT_MODELS,
  PROVIDER_NAMES,
  type AiProviderSettingsRecord,
  type ExplanationTask,
  type ProviderId,
  type ProviderProfile,
  type TaskRoute
} from "../lib/ai-settings";

export interface AiProviderSettingsProps {
  database?: ExplanationDatabase;
  onSettingsChanged?: () => void;
}

const PROVIDERS: ProviderId[] = ["openai", "gemini", "anthropic"];

export function AiProviderSettings({
  database: propDatabase,
  onSettingsChanged
}: AiProviderSettingsProps) {
  const [record, setRecord] = useState<AiProviderSettingsRecord>({
    id: "default",
    profiles: {},
    routes: {},
    updatedAt: new Date().toISOString()
  });
  const [activeProvider, setActiveProvider] = useState<ProviderId>("openai");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [modelInput, setModelInput] = useState(PROVIDER_DEFAULT_MODELS.openai);
  const [baseUrlInput, setBaseUrlInput] = useState("");

  const [sentenceProvider, setSentenceProvider] = useState<ProviderId>("openai");
  const [sentenceModel, setSentenceModel] = useState("gpt-4o-mini");
  const [wordProvider, setWordProvider] = useState<ProviderId>("openai");
  const [wordModel, setWordModel] = useState("gpt-4o-mini");

  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    async function load() {
      const db = propDatabase ?? new ExplanationDatabase();
      try {
        const stored = await loadAiProviderSettingsRecord(db);
        if (!active) return;
        if (stored) {
          setRecord(stored);

          // Initialize route controls from stored routes or fallbacks
          const sentRoute = stored.routes?.sentence;
          if (sentRoute) {
            setSentenceProvider(sentRoute.provider);
            setSentenceModel(sentRoute.model);
          } else if (stored.profiles.openai) {
            setSentenceProvider("openai");
            setSentenceModel(stored.profiles.openai.defaultModel);
          }

          const wdRoute = stored.routes?.word;
          if (wdRoute) {
            setWordProvider(wdRoute.provider);
            setWordModel(wdRoute.model);
          } else if (stored.profiles.openai) {
            setWordProvider("openai");
            setWordModel(stored.profiles.openai.defaultModel);
          }

          // Populate active profile editor
          const profile = stored.profiles.openai;
          if (profile) {
            setApiKeyInput(profile.apiKey);
            setModelInput(profile.defaultModel);
            setBaseUrlInput(profile.baseUrl ?? "");
          }
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load AI settings.");
      } finally {
        if (active) setReady(true);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [propDatabase]);

  const selectProviderTab = (provider: ProviderId) => {
    setActiveProvider(provider);
    setMessage(undefined);
    setError(undefined);
    const profile = record.profiles[provider];
    if (profile) {
      setApiKeyInput(profile.apiKey);
      setModelInput(profile.defaultModel);
      setBaseUrlInput(profile.baseUrl ?? "");
    } else {
      setApiKeyInput("");
      setModelInput(PROVIDER_DEFAULT_MODELS[provider]);
      setBaseUrlInput("");
    }
  };

  const reloadSettings = async (db: ExplanationDatabase) => {
    const updated = await loadAiProviderSettingsRecord(db);
    if (updated) {
      setRecord(updated);
    } else {
      setRecord({ id: "default", profiles: {}, routes: {}, updatedAt: new Date().toISOString() });
    }
    onSettingsChanged?.();
  };

  const handleSaveProfile = async () => {
    setMessage(undefined);
    setError(undefined);
    if (!apiKeyInput.trim() || !modelInput.trim()) {
      setError("An API key and default model are required.");
      return;
    }

    const db = propDatabase ?? new ExplanationDatabase();
    try {
      await saveProfile(db, {
        provider: activeProvider,
        apiKey: apiKeyInput.trim(),
        defaultModel: modelInput.trim(),
        ...(activeProvider === "openai" && baseUrlInput.trim() ? { baseUrl: baseUrlInput.trim() } : {})
      });

      // Default route assignment if no route exists yet
      const currentRecord = (await loadAiProviderSettingsRecord(db)) ?? record;
      if (!currentRecord.routes?.sentence) {
        await saveTaskRoute(db, "sentence", { provider: activeProvider, model: modelInput.trim() });
        setSentenceProvider(activeProvider);
        setSentenceModel(modelInput.trim());
      }
      if (!currentRecord.routes?.word) {
        await saveTaskRoute(db, "word", { provider: activeProvider, model: modelInput.trim() });
        setWordProvider(activeProvider);
        setWordModel(modelInput.trim());
      }

      await reloadSettings(db);
      setMessage(`Saved ${PROVIDER_NAMES[activeProvider]} profile on this device.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    }
  };

  const handleRemoveProfile = async () => {
    setMessage(undefined);
    setError(undefined);

    // Check removal guard
    const isSelectedBySentence = record.routes?.sentence?.provider === activeProvider;
    const isSelectedByWord = record.routes?.word?.provider === activeProvider;

    if (isSelectedBySentence || isSelectedByWord) {
      const dependentTasks = [
        isSelectedBySentence ? "sentence explanation" : "",
        isSelectedByWord ? "word / phrase explanation" : ""
      ]
        .filter(Boolean)
        .join(" and ");
      setError(
        `Cannot remove ${PROVIDER_NAMES[activeProvider]} profile because it is currently selected for ${dependentTasks}. Reassign dependent routes first.`
      );
      return;
    }

    const db = propDatabase ?? new ExplanationDatabase();
    try {
      await removeProfile(db, activeProvider);
      await reloadSettings(db);
      setApiKeyInput("");
      setModelInput(PROVIDER_DEFAULT_MODELS[activeProvider]);
      setBaseUrlInput("");
      setMessage(`Removed ${PROVIDER_NAMES[activeProvider]} profile from this device.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove profile.");
    }
  };

  const handleSaveRoute = async (task: ExplanationTask, provider: ProviderId, model: string) => {
    setMessage(undefined);
    setError(undefined);
    if (!model.trim()) {
      setError(`Model is required for ${task} explanation route.`);
      return;
    }
    const db = propDatabase ?? new ExplanationDatabase();
    try {
      await saveTaskRoute(db, task, { provider, model: model.trim() });
      await reloadSettings(db);
      setMessage(`Updated ${task} explanation route to ${PROVIDER_NAMES[provider]} (${model.trim()}).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save route.");
    }
  };

  const connectedProviders = PROVIDERS.filter((p) => {
    const prof = record.profiles[p];
    return Boolean(prof && prof.apiKey.trim() && prof.defaultModel.trim());
  });

  const activeProfile = record.profiles[activeProvider];
  const isConnected = Boolean(activeProfile && activeProfile.apiKey.trim());

  return (
    <div className="space-y-6">
      {/* Providers list */}
      <section className="rounded-xl border border-hairline bg-surface-elevated p-4" aria-label="AI provider settings">
        <h2 className="mb-1 text-sm font-semibold text-ink">AI providers</h2>
        <p className="mb-4 text-xs leading-5 text-ink-muted">
          Connect your AI providers using your own API keys. Saved settings stay in this browser and are never exported.
        </p>

        <div className="space-y-2">
          {PROVIDERS.map((provider) => {
            const prof = record.profiles[provider];
            const profileConnected = Boolean(prof && prof.apiKey.trim());
            const isTabActive = activeProvider === provider;

            return (
              <div
                key={provider}
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                  isTabActive
                    ? "border-primary bg-surface-subtle"
                    : "border-hairline bg-surface-elevated hover:bg-surface-subtle/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-ink">{PROVIDER_NAMES[provider]}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      profileConnected
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                        : "bg-surface-subtle text-ink-muted border border-hairline"
                    }`}
                  >
                    {profileConnected ? "connected" : "not connected"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => selectProviderTab(provider)}
                  className="rounded-md border border-hairline-strong px-2.5 py-1 text-xs font-medium text-ink-secondary hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {isTabActive ? "Editing" : profileConnected ? "Edit" : "Connect"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Profile Editor */}
        <div className="mt-6 rounded-lg border border-hairline p-4 bg-surface-subtle/30">
          <h3 className="mb-3 text-xs font-semibold text-ink uppercase tracking-wider">
            Edit {PROVIDER_NAMES[activeProvider]} settings
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink-secondary" htmlFor="ai-api-key">
                API key
              </label>
              <input
                id="ai-api-key"
                type="password"
                autoComplete="off"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={`${PROVIDER_NAMES[activeProvider]} API key`}
                className="mt-1 w-full rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-secondary" htmlFor="ai-model">
                Default Model
              </label>
              <input
                id="ai-model"
                type="text"
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                placeholder={PROVIDER_DEFAULT_MODELS[activeProvider]}
                className="mt-1 w-full rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            {/* Advanced settings for OpenAI custom base URL */}
            {activeProvider === "openai" ? (
              <details className="mt-2 text-xs text-ink-secondary">
                <summary className="cursor-pointer font-medium hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  Advanced settings
                </summary>
                <div className="mt-2 space-y-1">
                  <label className="block font-medium text-ink-secondary" htmlFor="ai-base-url">
                    Base URL <span className="text-ink-muted">(optional)</span>
                  </label>
                  <input
                    id="ai-base-url"
                    type="text"
                    value={baseUrlInput}
                    onChange={(e) => setBaseUrlInput(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </details>
            ) : null}

            <div className="mt-4 flex gap-2 pt-2">
              <button
                type="button"
                disabled={!ready || !apiKeyInput.trim() || !modelInput.trim()}
                onClick={() => void handleSaveProfile()}
                className="flex-1 rounded-lg bg-primary-hover px-3 py-1.5 text-sm font-medium text-on-primary transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isConnected ? "Save changes" : "Save profile"}
              </button>
              {isConnected ? (
                <button
                  type="button"
                  disabled={!ready}
                  onClick={() => void handleRemoveProfile()}
                  className="rounded-lg border border-hairline-strong px-3 py-1.5 text-sm text-ink-secondary transition-colors hover:border-error hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Disconnect
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Task Routing Section */}
      <section className="rounded-xl border border-hairline bg-surface-elevated p-4" aria-label="Explanation models routing">
        <h2 className="mb-1 text-sm font-semibold text-ink">Explanation models</h2>
        <p className="mb-4 text-xs leading-5 text-ink-muted">
          Select which connected provider and model to use for each task route.
        </p>

        <div className="space-y-4">
          {/* Sentence route */}
          <div className="rounded-lg border border-hairline p-3">
            <label className="block text-xs font-semibold text-ink" htmlFor="route-sentence-provider">
              Sentence explanation
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-ink-secondary" htmlFor="route-sentence-provider">
                  Provider
                </label>
                <select
                  id="route-sentence-provider"
                  value={sentenceProvider}
                  disabled={connectedProviders.length === 0}
                  onChange={(e) => {
                    const p = e.target.value as ProviderId;
                    setSentenceProvider(p);
                    const defaultM = record.profiles[p]?.defaultModel || PROVIDER_DEFAULT_MODELS[p];
                    setSentenceModel(defaultM);
                    void handleSaveRoute("sentence", p, defaultM);
                  }}
                  className="mt-1 w-full rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-1.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                >
                  {connectedProviders.length === 0 ? (
                    <option value="">No connected providers</option>
                  ) : (
                    connectedProviders.map((p) => (
                      <option key={p} value={p}>
                        {PROVIDER_NAMES[p]}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-secondary" htmlFor="route-sentence-model">
                  Model
                </label>
                <input
                  id="route-sentence-model"
                  type="text"
                  value={sentenceModel}
                  disabled={connectedProviders.length === 0}
                  onChange={(e) => setSentenceModel(e.target.value)}
                  onBlur={() => {
                    if (sentenceModel.trim()) {
                      void handleSaveRoute("sentence", sentenceProvider, sentenceModel);
                    }
                  }}
                  className="mt-1 w-full rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-1.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Word route */}
          <div className="rounded-lg border border-hairline p-3">
            <label className="block text-xs font-semibold text-ink" htmlFor="route-word-provider">
              Word / phrase explanation
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-ink-secondary" htmlFor="route-word-provider">
                  Provider
                </label>
                <select
                  id="route-word-provider"
                  value={wordProvider}
                  disabled={connectedProviders.length === 0}
                  onChange={(e) => {
                    const p = e.target.value as ProviderId;
                    setWordProvider(p);
                    const defaultM = record.profiles[p]?.defaultModel || PROVIDER_DEFAULT_MODELS[p];
                    setWordModel(defaultM);
                    void handleSaveRoute("word", p, defaultM);
                  }}
                  className="mt-1 w-full rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-1.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                >
                  {connectedProviders.length === 0 ? (
                    <option value="">No connected providers</option>
                  ) : (
                    connectedProviders.map((p) => (
                      <option key={p} value={p}>
                        {PROVIDER_NAMES[p]}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-secondary" htmlFor="route-word-model">
                  Model
                </label>
                <input
                  id="route-word-model"
                  type="text"
                  value={wordModel}
                  disabled={connectedProviders.length === 0}
                  onChange={(e) => setWordModel(e.target.value)}
                  onBlur={() => {
                    if (wordModel.trim()) {
                      void handleSaveRoute("word", wordProvider, wordModel);
                    }
                  }}
                  className="mt-1 w-full rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-1.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Copy */}
      <p className="text-xs leading-5 text-ink-muted">
        Browser storage is local convenience, not a secure secret vault. Remove the key on shared or untrusted devices.
      </p>

      {/* Messages */}
      {message ? (
        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-error font-medium" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
