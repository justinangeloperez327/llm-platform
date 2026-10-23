import { describe, expect, it } from "vitest";
import { draftKey, findSample, SAMPLE_CONVERSATIONS } from "./samples";

describe("sample conversation navigation", () => {
  it("uses only declared sample IDs", () => {
    expect(findSample("rag")?.title).toBe("Understanding RAG");
    expect(findSample("invalid")).toBeUndefined();
    expect(new Set(SAMPLE_CONVERSATIONS.map((x) => x.id)).size).toBe(SAMPLE_CONVERSATIONS.length);
  });
  it("keeps draft keys separate per conversation", () => {
    expect(draftKey()).not.toBe(draftKey("rag"));
    expect(draftKey("rag")).not.toBe(draftKey("routing"));
  });
});
