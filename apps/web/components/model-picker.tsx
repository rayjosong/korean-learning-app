"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  formatModelReference,
  formatProviderModelLabel,
  getProviderDisplayName,
  parseModelReference,
  type ProviderKey
} from "@korean-learning/ai";
import type { AiProviderSettingsRecord } from "@/lib/ai-settings";
import type { ProviderStatusResponse } from "@/lib/provider-status";

export interface AvailableModelOption {
  reference: string;
  provider: ProviderKey;
  model: string;
  providerLabel: string;
  label: string;
}

export interface ModelPickerProps {
  settings: AiProviderSettingsRecord[];
  status?: ProviderStatusResponse;
  value?: string;
  onChange: (reference: string) => void;
  disabled?: boolean;
}

export function availableModels(
  settings: AiProviderSettingsRecord[],
  status?: ProviderStatusResponse
): AvailableModelOption[] {
  const models: AvailableModelOption[] = [];
  for (const setting of settings) {
    if (!setting.enabled || !setting.model.trim()) continue;
    if (setting.provider === "antigravity_cli") continue;
    if (setting.provider === "openai-compatible") {
      if (!setting.apiKey?.trim()) continue;
      const hasCustomBaseUrl = Boolean(setting.baseUrl?.trim());
      const providerLabel = getProviderDisplayName("openai-compatible", { hasCustomBaseUrl });
      models.push({
        reference: formatModelReference("openai-compatible", setting.model),
        provider: "openai-compatible",
        model: setting.model.trim(),
        providerLabel,
        label: formatProviderModelLabel("openai-compatible", setting.model.trim(), { hasCustomBaseUrl })
      });
      continue;
    }

    if (status && status.probes[setting.provider]?.status !== "ready") continue;

    const providerLabel = getProviderDisplayName(setting.provider);
    models.push({
      reference: formatModelReference(setting.provider, setting.model),
      provider: setting.provider,
      model: setting.model.trim(),
      providerLabel,
      label: formatProviderModelLabel(setting.provider, setting.model.trim())
    });
  }
  return models;
}

export function ModelPicker({ settings, status, value, onChange, disabled }: ModelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  const models = useMemo(() => availableModels(settings, status), [settings, status]);

  const selectedModel = useMemo(() => {
    if (!value) return undefined;
    return models.find((m) => m.reference === value);
  }, [models, value]);

  const selectedDisplayLabel = useMemo(() => {
    if (selectedModel) return selectedModel.label;
    if (value) {
      try {
        const parsed = parseModelReference(value);
        return formatProviderModelLabel(parsed.provider, parsed.model);
      } catch {
        return value;
      }
    }
    return undefined;
  }, [selectedModel, value]);

  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Group models by provider
  const groupedModels = useMemo(() => {
    const groups = new Map<string, AvailableModelOption[]>();
    for (const item of models) {
      const list = groups.get(item.providerLabel) ?? [];
      list.push(item);
      groups.set(item.providerLabel, list);
    }
    return Array.from(groups.entries());
  }, [models]);

  if (models.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <span>No AI providers ready.</span>
        <Link
          href="/settings"
          className="font-medium text-primary hover:underline focus-visible:outline-primary"
        >
          Connect a provider →
        </Link>
      </div>
    );
  }

  function handleSelect(ref: string) {
    onChange(ref);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setIsOpen(true);
        const currentIndex = models.findIndex((m) => m.reference === value);
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % models.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + models.length) % models.length);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (models[highlightedIndex]) {
        handleSelect(models[highlightedIndex].reference);
      }
    } else if (event.key === "Tab") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        onClick={() => {
          setIsOpen((prev) => !prev);
          const currentIndex = models.findIndex((m) => m.reference === value);
          setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
        }}
        onKeyDown={handleKeyDown}
        className="inline-flex items-center justify-between gap-3 rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-1.5 text-sm font-medium text-ink shadow-sm transition hover:border-hairline-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>{selectedDisplayLabel ?? "Select an AI model"}</span>
        <span aria-hidden="true" className="text-xs text-ink-muted">
          ▾
        </span>
      </button>

      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-label="Explanation model options"
          className="absolute right-0 z-30 mt-1.5 w-64 origin-top-right rounded-lg border border-hairline bg-surface-elevated p-1 shadow-lg focus:outline-none"
        >
          {groupedModels.map(([groupLabel, items]) => (
            <div key={groupLabel} role="group" aria-label={groupLabel} className="py-1">
              <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                {groupLabel}
              </div>
              {items.map((item) => {
                const isSelected = item.reference === value;
                const flatIndex = models.findIndex((m) => m.reference === item.reference);
                const isHighlighted = flatIndex === highlightedIndex;

                return (
                  <div
                    key={item.reference}
                    role="option"
                    aria-selected={isSelected}
                    id={`model-option-${item.reference.replace(/[^a-zA-Z0-9_-]/g, "_")}`}
                    onClick={() => handleSelect(item.reference)}
                    onMouseEnter={() => setHighlightedIndex(flatIndex)}
                    className={`flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                      isHighlighted
                        ? "bg-surface-subtle text-ink"
                        : "text-ink-secondary hover:bg-surface-subtle hover:text-ink"
                    } ${isSelected ? "font-semibold text-primary" : ""}`}
                  >
                    <span>{item.model}</span>
                    {isSelected ? (
                      <span aria-hidden="true" className="text-primary">
                        ✓
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
