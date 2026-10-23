export type ThemeChoice = "dark" | "light";
export type DensityChoice = "comfortable" | "compact";
export type ResponseStyle = "balanced" | "concise";

export interface Preferences {
  theme: ThemeChoice;
  density: DensityChoice;
  responseStyle: ResponseStyle;
}

export const PREFERENCES_KEY = "llm-platform.preferences.v1";
export const DEFAULT_PREFERENCES: Preferences = {
  theme: "dark",
  density: "comfortable",
  responseStyle: "balanced",
};

export function parsePreferences(raw: string | null): Preferences {
  if (!raw) return { ...DEFAULT_PREFERENCES };
  try {
    const obj: unknown = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return { ...DEFAULT_PREFERENCES };
    const value = obj as Record<string, unknown>;
    return {
      theme: value.theme === "light" ? "light" : "dark",
      density: value.density === "compact" ? "compact" : "comfortable",
      responseStyle: value.responseStyle === "concise" ? "concise" : "balanced",
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}
