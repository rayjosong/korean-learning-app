"use client";

import { useState, useEffect } from "react";
import { AiProviderSettings } from "./ai-provider-settings";
import { LearnerDataExportPanel } from "./learner-data-export-panel";
import { loadAiSettings, saveAiSettings, removeAiSettings, loadProviderSettings, loadSelectedModel, saveCliProviderSettings, selectQualifiedModel, setCliProviderEnabled, type AiSettings, type AiProviderSettingsRecord, type CliAiProvider } from "@/lib/ai-settings";
import { loadProviderStatus, type ProviderStatusResponse } from "@/lib/provider-status";
import { ExplanationDatabase } from "@korean-learning/storage";

export function SettingsDashboard() {
  const [settings, setSettings] = useState<AiSettings>({ apiKey: "", model: "" });
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const [providerSettings, setProviderSettings] = useState<AiProviderSettingsRecord[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>();
  const [providerStatus, setProviderStatus] = useState<ProviderStatusResponse>();

  useEffect(() => {
    async function load() {
      const db = new ExplanationDatabase();
      await db.open();
      const stored = await loadAiSettings(db);
      if (stored) {
        setSettings(stored);
        setSaved(true);
      }
      const [all, selected, status] = await Promise.all([loadProviderSettings(db), loadSelectedModel(db), loadProviderStatus().catch(() => undefined)]);
      setProviderSettings(all); setSelectedModel(selected); setProviderStatus(status); setReady(true);
      db.close();
    }
    void load();
  }, []);

  const handleSave = async () => {
    const db = new ExplanationDatabase();
    await db.open();
    await saveAiSettings(db, settings);
    setSaved(true);
    db.close();
  };

  const handleRemove = async () => {
    const db = new ExplanationDatabase();
    await db.open();
    await removeAiSettings(db);
    setSettings({ apiKey: "", model: "" });
    setSaved(false);
    db.close();
  };

  const refreshProviderSettings = async (action: (db: ExplanationDatabase) => Promise<void>) => {
    const db = new ExplanationDatabase(); await db.open(); await action(db); setProviderSettings(await loadProviderSettings(db)); setSelectedModel(await loadSelectedModel(db)); db.close();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-12">
      <section>
        <h2 className="mb-6 text-xl font-semibold tracking-tight text-ink">AI Provider</h2>
        <AiProviderSettings
          settings={settings}
          ready={ready}
          saved={saved}
          onChange={setSettings}
          onSave={handleSave}
          onRemove={handleRemove}
          providerSettings={providerSettings}
          providerStatus={providerStatus}
          selectedModel={selectedModel}
          onSaveCli={(provider: CliAiProvider, model) => void refreshProviderSettings((db) => saveCliProviderSettings(db, { provider, model }))}
          onEnabledChange={(provider: CliAiProvider, enabled) => void refreshProviderSettings((db) => setCliProviderEnabled(db, provider, enabled))}
          onSelectedModelChange={(reference) => { if (reference) void refreshProviderSettings((db) => selectQualifiedModel(db, reference)); }}
        />
      </section>

      <section>
        <h2 className="mb-6 text-xl font-semibold tracking-tight text-ink">Data</h2>
        <LearnerDataExportPanel />
      </section>
    </div>
  );
}
