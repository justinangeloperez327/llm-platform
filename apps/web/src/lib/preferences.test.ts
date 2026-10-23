import { describe, expect, it } from "vitest";
import { DEFAULT_PREFERENCES, parsePreferences } from "./preferences";

describe("parsePreferences", () => {
  it("uses dark theme for new visitors", () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
  });
  it("reads validated existing settings", () => {
    expect(parsePreferences('{"theme":"light","density":"compact","responseStyle":"concise"}'))
      .toEqual({ theme: "light", density: "compact", responseStyle: "concise" });
  });
  it("does not accept invalid settings or malformed JSON", () => {
    expect(parsePreferences("not json")).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('{"theme":"blue","density":77}')).toEqual(DEFAULT_PREFERENCES);
  });
});
