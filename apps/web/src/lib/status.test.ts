import { describe, expect, it } from "vitest";
import { statusLabel } from "./status";

describe("statusLabel", () => {
  it("does not claim a local service is running", () => {
    expect(statusLabel("offline")).toBe("Local service not checked");
  });
  it("marks deferred features as planned", () => {
    expect(statusLabel("planned")).toBe("Later group");
  });
});

