"use client";

import { AiProviderSettings } from "./ai-provider-settings";
import { LearnerDataExportPanel } from "./learner-data-export-panel";

export function SettingsDashboard() {
  return (
    <div className="mx-auto max-w-2xl space-y-12">
      <section>
        <h2 className="mb-6 text-xl font-semibold tracking-tight text-ink">AI Provider</h2>
        <AiProviderSettings />
      </section>

      <section>
        <h2 className="mb-6 text-xl font-semibold tracking-tight text-ink">Data</h2>
        <LearnerDataExportPanel />
      </section>
    </div>
  );
}
