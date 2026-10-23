import { describe, expect, it } from "vitest";
import { readableAuthError, validPassword } from "./auth";

describe("authentication UI validation", () => {
  it("enforces a 12-character minimum", () => {
    expect(validPassword("short")).toBe(false);
    expect(validPassword("a".repeat(12))).toBe(true);
    expect(validPassword("x".repeat(257))).toBe(false);
  });
  it("does not display arbitrary API error details", () => {
    expect(readableAuthError(401, { detail: "Invalid email or password" }))
      .toBe("Invalid email or password");
    expect(readableAuthError(400, { detail: "<script>attack</script>" }))
      .not.toContain("<script>");
    expect(readableAuthError(429, {})).toContain("Too many attempts");
  });
});

