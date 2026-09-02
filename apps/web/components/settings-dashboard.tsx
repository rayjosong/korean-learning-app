"use client";

import { useAiProviderSettings } from "@/lib/use-ai-provider-settings";
import { AiProviderSettings } from "./ai-provider-settings";
import { LearnerDataExportPanel } from "./learner-data-export-panel";

export function SettingsDashboard() {
  const {
    status,
    errorMessage,
    providerSettings,
    selectedModel,
    providerStatus,
    openAiSettings,
    savedOpenAi,
    mutationState,
    reload,
    setOpenAiSettings,
    saveOpenAi,
    testOpenAi,
    removeOpenAi,
    saveCli,
    testCli,
    setCliEnabled,
    selectModel,
    clearMutationMessage
  } = useAiProviderSettings();

  return (
    <div className="mx-auto max-w-2xl space-y-12">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-ink">AI Model</h1>
          {status === "error" ? (
            <button
              type="button"
              onClick={() => void reload()}
              className="text-xs font-medium text-primary hover:underline focus-visible:outline-primary"
            >
              Retry
            </button>
          ) : null}
        </div>

        {status === "error" && errorMessage ? (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-error/30 bg-surface-elevated p-4 text-sm text-error"
          >
            <p className="font-medium">Could not load AI provider settings.</p>
            <p className="mt-1 text-xs text-ink-muted">{errorMessage}</p>
          </div>
        ) : null}

        {mutationState.successMessage ? (
          <div
            role="status"
            className="mb-4 flex items-center justify-between rounded-xl border border-jade-soft bg-jade-soft/50 p-3 text-xs text-jade-deep"
          >
            <span>{mutationState.successMessage}</span>
            <button
              type="button"
              onClick={clearMutationMessage}
              className="text-[11px] font-medium text-ink-muted hover:text-ink"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {mutationState.error ? (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between rounded-xl border border-error/30 bg-surface-elevated p-3 text-xs text-error"
          >
            <span>{mutationState.error}</span>
            <button
              type="button"
              onClick={clearMutationMessage}
              className="text-[11px] font-medium text-ink-muted hover:text-ink"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <AiProviderSettings
          settings={openAiSettings}
          ready={status === "ready"}
          saved={savedOpenAi}
          onChange={setOpenAiSettings}
          onSave={saveOpenAi}
          onTest={testOpenAi}
          onRemove={removeOpenAi}
          providerSettings={providerSettings}
          providerStatus={providerStatus}
          selectedModel={selectedModel}
          onSaveCli={saveCli}
          onTestCli={testCli}
          onEnabledChange={setCliEnabled}
          onSelectedModelChange={selectModel}
        />
      </section>

      <section>
        <h2 className="mb-6 text-xl font-semibold tracking-tight text-ink">Data</h2>
        <LearnerDataExportPanel />
      </section>
    </div>
  );
}
