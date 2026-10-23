"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_KEY,
  parsePreferences,
  type Preferences,
} from "@/lib/preferences";

interface PreferenceContextValue {
  preferences: Preferences;
  hydrated: boolean;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  reset: () => void;
}

const PreferenceContext = createContext<PreferenceContextValue | null>(null);
const CHANGE_EVENT = "llm-platform:preferences";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(PREFERENCES_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot() {
  return null;
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const preferences = useMemo(() => parsePreferences(stored), [stored]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", preferences.theme === "dark");
    document.documentElement.style.colorScheme = preferences.theme;
  }, [preferences.theme]);

  const persist = useCallback((value: Preferences) => {
    try {
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(value));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Browser storage can be unavailable; keep the shell functional.
    }
  }, []);

  const setPreference = useCallback(<K extends keyof Preferences>(
    key: K, nextValue: Preferences[K],
  ) => {
    const latest = parsePreferences(getSnapshot());
    persist({ ...latest, [key]: nextValue });
  }, [persist]);

  const reset = useCallback(() => persist({ ...DEFAULT_PREFERENCES }), [persist]);

  const value = useMemo<PreferenceContextValue>(() => ({
    preferences,
    hydrated: true,
    setPreference,
    reset,
  }), [preferences, setPreference, reset]);

  return <PreferenceContext.Provider value={value}>{children}</PreferenceContext.Provider>;
}

export function usePreferences(): PreferenceContextValue {
  const value = useContext(PreferenceContext);
  if (!value) throw new Error("PreferencesProvider is required");
  return value;
}
