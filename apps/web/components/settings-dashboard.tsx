"use client";

import { useState, useEffect } from "react";
import { AiProviderSettings } from "./ai-provider-settings";
import { LearnerDataExportPanel } from "./learner-data-export-panel";
import { loadAiSettings, saveAiSettings, removeAiSettings, type AiSettings } from "@/lib/ai-settings";
import { ExplanationDatabase } from "@korean-learning/storage";

export function SettingsDashboard() {
  const [settings, setSettings] = useState<AiSettings>({ apiKey: "", model: "" });
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const db = new ExplanationDatabase();
      await db.open();
      const stored = await loadAiSettings(db);
      if (stored) {
        setSettings(stored);
        setSaved(true);
      }
      setReady(true);
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
        />
      </section>

      <section>
        <h2 className="mb-6 text-xl font-semibold tracking-tight text-ink">Data</h2>
        <LearnerDataExportPanel />
      </section>
    </div>
  );
}
