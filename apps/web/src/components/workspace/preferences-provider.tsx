"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>({ ...DEFAULT_PREFERENCES });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setPreferences(parsePreferences(window.localStorage.getItem(PREFERENCES_KEY)));
    } catch {
      setPreferences({ ...DEFAULT_PREFERENCES });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", preferences.theme === "dark");
    document.documentElement.style.colorScheme = preferences.theme;
    if (!hydrated) return;
    try {
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
      // Restricted browser storage should not break the interface.
    }
  }, [preferences, hydrated]);

  const value = useMemo<PreferenceContextValue>(() => ({
    preferences,
    hydrated,
    setPreference: (key, nextValue) =>
      setPreferences((prev) => ({ ...prev, [key]: nextValue })),
    reset: () => setPreferences({ ...DEFAULT_PREFERENCES }),
  }), [preferences, hydrated]);

  return <PreferenceContext.Provider value={value}>{children}</PreferenceContext.Provider>;
}

export function usePreferences(): PreferenceContextValue {
  const value = useContext(PreferenceContext);
  if (!value) throw new Error("PreferencesProvider is required");
  return value;
}
