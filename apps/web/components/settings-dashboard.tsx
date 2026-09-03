"use client";

import { useState, useEffect } from "react";
import { AiProviderSettings } from "./ai-provider-settings";
import { LearnerDataExportPanel } from "./learner-data-export-panel";
import { loadAiSettings, saveAiSettings, removeAiSettings, type AiSettings } from "@/lib/ai-settings";
import { loadAssistanceLevel, saveAssistanceLevel } from "@/lib/assistance-settings";
import type { AssistanceLevel } from "@korean-learning/storage/assistance-settings";
import { ExplanationDatabase } from "@korean-learning/storage";

export function SettingsDashboard() {
  const [settings, setSettings] = useState<AiSettings>({ apiKey: "", model: "" });
  const [assistance, setAssistance] = useState<AssistanceLevel>("guided");
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
      try {
        const level = await loadAssistanceLevel(db);
        setAssistance(level);
      } catch {
        // fallback to guided
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

  const handleAssistanceChange = async (level: AssistanceLevel) => {
    setAssistance(level);
    const db = new ExplanationDatabase();
    await db.open();
    await saveAssistanceLevel(db, level);
    db.close();
  };

  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-hairline bg-surface p-7 shadow-editorial">
        <label htmlFor="assistance" className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-deep">
          Default assistance
        </label>
        <p className="mb-4 mt-1 text-[15px] text-ink-muted">
          Choose how much English appears alongside each Korean sentence.
        </p>
        <select
          id="assistance"
          value={assistance}
          onChange={(e) => void handleAssistanceChange(e.target.value as AssistanceLevel)}
          className="min-h-[44px] rounded-control border border-hairline bg-surface px-3.5 text-[14px] font-medium text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Default assistance level"
        >
          <option value="guided">Guided</option>
          <option value="full">Full</option>
          <option value="immersion">Immersion</option>
        </select>
      </section>

      <section className="rounded-xl border border-hairline bg-surface p-7 shadow-editorial">
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

      <section className="rounded-xl border border-hairline bg-surface p-7 shadow-editorial">
        <h2 className="mb-6 text-xl font-semibold tracking-tight text-ink">Data</h2>
        <LearnerDataExportPanel />
      </section>
    </div>
  );
}
