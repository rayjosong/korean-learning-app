"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  disableAiProvider,
  loadAiSettings,
  loadProviderSettings,
  loadSelectedModel,
  removeAiProvider,
  saveAndSelectCliProvider,
  saveAndSelectOpenAiProvider,
  saveCliProvider,
  saveOpenAiProvider,
  selectModelReference,
  setCliProviderEnabled,
  type AiProviderSettingsRecord,
  type AiSettings,
  type CliAiProvider
} from "./ai-settings";
import {
  loadProviderStatus,
  validateProvider,
  type ProviderStatusResponse,
  type ProviderValidationResult
} from "./provider-status";
import { ExplanationDatabase } from "@korean-learning/storage";

export type ControllerStatus = "loading" | "ready" | "error";

export interface ProviderMutationState {
  status: "idle" | "saving" | "testing" | "removing";
  provider?: string;
  error?: string;
  successMessage?: string;
}

export function useAiProviderSettings() {
  const [status, setStatus] = useState<ControllerStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [providerSettings, setProviderSettings] = useState<AiProviderSettingsRecord[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>();
  const [providerStatus, setProviderStatus] = useState<ProviderStatusResponse>();
  const [openAiSettings, setOpenAiSettings] = useState<AiSettings>({ apiKey: "", model: "gpt-4o-mini" });
  const [savedOpenAi, setSavedOpenAi] = useState(false);
  const [mutationState, setMutationState] = useState<ProviderMutationState>({ status: "idle" });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadAll = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(undefined);
    const db = new ExplanationDatabase();
    try {
      await db.open();
      const [storedOpenAi, allSettings, activeSelection, statusResponse] = await Promise.all([
        loadAiSettings(db),
        loadProviderSettings(db),
        loadSelectedModel(db),
        loadProviderStatus().catch((err) => {
          console.warn("Could not load server CLI provider status:", err);
          return undefined;
        })
      ]);

      if (!mountedRef.current) return;

      if (storedOpenAi) {
        setOpenAiSettings(storedOpenAi);
        setSavedOpenAi(true);
      } else {
        setSavedOpenAi(false);
      }

      setProviderSettings(allSettings);
      setSelectedModel(activeSelection);
      setProviderStatus(statusResponse);
      setStatus("ready");
    } catch (err) {
      if (!mountedRef.current) return;
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to load AI provider settings.");
    } finally {
      db.close();
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const saveOpenAi = useCallback(
    async (settings: AiSettings, andSelect = false) => {
      setMutationState({ status: "saving", provider: "openai-compatible" });
      const db = new ExplanationDatabase();
      try {
        await db.open();
        if (andSelect) {
          await saveAndSelectOpenAiProvider(db, settings);
        } else {
          await saveOpenAiProvider(db, settings);
        }
        if (!mountedRef.current) return;
        setOpenAiSettings(settings);
        setSavedOpenAi(true);
        const [all, active] = await Promise.all([loadProviderSettings(db), loadSelectedModel(db)]);
        if (!mountedRef.current) return;
        setProviderSettings(all);
        setSelectedModel(active);
        setMutationState({
          status: "idle",
          successMessage: andSelect ? "Saved and selected as active model." : "Changes saved."
        });
      } catch (err) {
        if (!mountedRef.current) return;
        setMutationState({
          status: "idle",
          error: err instanceof Error ? err.message : "Failed to save OpenAI settings."
        });
      } finally {
        db.close();
      }
    },
    []
  );

  const testOpenAi = useCallback(async (settings: AiSettings): Promise<ProviderValidationResult> => {
    setMutationState({ status: "testing", provider: "openai-compatible" });
    try {
      const result = await validateProvider("openai-compatible", settings);
      if (!mountedRef.current) return result;
      setMutationState({
        status: "idle",
        error: result.ok ? undefined : result.message,
        successMessage: result.ok ? result.message : undefined
      });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Validation failed.";
      if (mountedRef.current) {
        setMutationState({ status: "idle", error: msg });
      }
      return { ok: false, status: "unreachable", message: msg };
    }
  }, []);

  const removeOpenAi = useCallback(async () => {
    setMutationState({ status: "removing", provider: "openai-compatible" });
    const db = new ExplanationDatabase();
    try {
      await db.open();
      await removeAiProvider(db, "openai-compatible");
      if (!mountedRef.current) return;
      setOpenAiSettings({ apiKey: "", model: "gpt-4o-mini" });
      setSavedOpenAi(false);
      const [all, active] = await Promise.all([loadProviderSettings(db), loadSelectedModel(db)]);
      if (!mountedRef.current) return;
      setProviderSettings(all);
      setSelectedModel(active);
      setMutationState({ status: "idle", successMessage: "OpenAI credentials removed." });
    } catch (err) {
      if (!mountedRef.current) return;
      setMutationState({
        status: "idle",
        error: err instanceof Error ? err.message : "Failed to remove OpenAI credentials."
      });
    } finally {
      db.close();
    }
  }, []);

  const saveCli = useCallback(
    async (provider: CliAiProvider, model: string, andSelect = false) => {
      setMutationState({ status: "saving", provider });
      const db = new ExplanationDatabase();
      try {
        await db.open();
        if (andSelect) {
          await saveAndSelectCliProvider(db, { provider, model });
        } else {
          await saveCliProvider(db, { provider, model });
        }
        if (!mountedRef.current) return;
        const [all, active] = await Promise.all([loadProviderSettings(db), loadSelectedModel(db)]);
        if (!mountedRef.current) return;
        setProviderSettings(all);
        setSelectedModel(active);
        setMutationState({
          status: "idle",
          successMessage: andSelect ? `Selected ${model} as active model.` : "Changes saved."
        });
      } catch (err) {
        if (!mountedRef.current) return;
        setMutationState({
          status: "idle",
          error: err instanceof Error ? err.message : "Failed to save CLI settings."
        });
      } finally {
        db.close();
      }
    },
    []
  );

  const testCli = useCallback(async (provider: CliAiProvider): Promise<ProviderValidationResult> => {
    setMutationState({ status: "testing", provider });
    try {
      const result = await validateProvider(provider);
      if (!mountedRef.current) return result;
      setMutationState({
        status: "idle",
        error: result.ok ? undefined : result.message,
        successMessage: result.ok ? result.message : undefined
      });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Validation failed.";
      if (mountedRef.current) {
        setMutationState({ status: "idle", error: msg });
      }
      return { ok: false, status: "unreachable", message: msg };
    }
  }, []);

  const setCliEnabled = useCallback(async (provider: CliAiProvider, enabled: boolean) => {
    setMutationState({ status: "saving", provider });
    const db = new ExplanationDatabase();
    try {
      await db.open();
      if (enabled) {
        await setCliProviderEnabled(db, provider, true);
      } else {
        await disableAiProvider(db, provider);
      }
      if (!mountedRef.current) return;
      const [all, active] = await Promise.all([loadProviderSettings(db), loadSelectedModel(db)]);
      if (!mountedRef.current) return;
      setProviderSettings(all);
      setSelectedModel(active);
      setMutationState({ status: "idle", successMessage: enabled ? "Provider enabled." : "Provider disabled." });
    } catch (err) {
      if (!mountedRef.current) return;
      setMutationState({
        status: "idle",
        error: err instanceof Error ? err.message : "Failed to update provider."
      });
    } finally {
      db.close();
    }
  }, []);

  const selectModel = useCallback(async (reference: string) => {
    setMutationState({ status: "saving" });
    const db = new ExplanationDatabase();
    try {
      await db.open();
      await selectModelReference(db, reference);
      if (!mountedRef.current) return;
      setSelectedModel(reference);
      setMutationState({ status: "idle", successMessage: "Active model updated." });
    } catch (err) {
      if (!mountedRef.current) return;
      setMutationState({
        status: "idle",
        error: err instanceof Error ? err.message : "Failed to select model."
      });
    } finally {
      db.close();
    }
  }, []);

  const clearMutationMessage = useCallback(() => {
    setMutationState({ status: "idle" });
  }, []);

  return {
    status,
    errorMessage,
    providerSettings,
    selectedModel,
    providerStatus,
    openAiSettings,
    savedOpenAi,
    mutationState,
    reload: loadAll,
    setOpenAiSettings,
    saveOpenAi,
    testOpenAi,
    removeOpenAi,
    saveCli,
    testCli,
    setCliEnabled,
    selectModel,
    clearMutationMessage
  };
}
