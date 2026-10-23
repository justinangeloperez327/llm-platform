import { describe, expect, it } from "vitest";
import { draftKey, findSample, SAMPLE_CONVERSATIONS } from "./samples";

describe("sample conversation navigation", () => {
  it("uses only declared sample IDs", () => {
    expect(findSample("rag")?.title).toBe("Understanding RAG");
    expect(findSample("invalid")).toBeUndefined();
    expect(new Set(SAMPLE_CONVERSATIONS.map((x) => x.id)).size).toBe(SAMPLE_CONVERSATIONS.length);
  });
  it("keeps draft keys separate per conversation", () => {
    expect(draftKey("user1")).not.toBe(draftKey("user1", "rag"));
    expect(draftKey("user1", "rag")).not.toBe(draftKey("user1", "routing"));
    expect(draftKey("user1", "rag")).not.toBe(draftKey("user2", "rag"));
  });
});
