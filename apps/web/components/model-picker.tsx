"use client";

import { formatModelReference } from "@korean-learning/ai";
import type { AiProviderSettingsRecord } from "@/lib/ai-settings";
import type { ProviderStatusResponse } from "@/lib/provider-status";

export interface ModelPickerProps { settings: AiProviderSettingsRecord[]; status?: ProviderStatusResponse; value?: string; onChange: (reference: string) => void; }

export function availableModels(settings: AiProviderSettingsRecord[], status?: ProviderStatusResponse): { reference: string; label: string }[] {
  const models: { reference: string; label: string }[] = [];
  for (const setting of settings) {
    if (!setting.enabled || !setting.model.trim()) continue;
    if (setting.provider === "antigravity_cli") continue;
    if (setting.provider !== "openai-compatible" && status?.probes[setting.provider].status !== "ready") continue;
    models.push({ reference: formatModelReference(setting.provider, setting.model), label: `${setting.provider}: ${setting.model}` });
  }
  return models;
}

export function ModelPicker({ settings, status, value, onChange }: ModelPickerProps) {
  const models = availableModels(settings, status);
  return <label className="block text-xs font-medium text-ink-secondary">Explanation model
    <select aria-label="Explanation model" value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-2 text-sm text-ink">
      <option value="">Choose a ready provider</option>{models.map((model) => <option key={model.reference} value={model.reference}>{model.label}</option>)}
    </select>
  </label>;
}
