export interface SampleMessage {
  role: "user" | "assistant";
  text: string;
}
export interface SampleConversation {
  id: string;
  title: string;
  summary: string;
  messages: SampleMessage[];
}
export const SAMPLE_CONVERSATIONS: SampleConversation[] = [
  {
    id: "rag",
    title: "Understanding RAG",
    summary: "Retrieval-augmented generation",
    messages: [
      { role: "user", text: "What is RAG and when should an application use it?" },
      { role: "assistant", text: "Retrieval-augmented generation finds relevant information from authorized sources before constructing a model prompt. It is especially useful for documents and information that changes over time. Retrieval does not retrain the model." },
    ],
  },
  {
    id: "routing",
    title: "Choosing a data source",
    summary: "SQL, semantic and code retrieval",
    messages: [
      { role: "user", text: "Should I use a vector database to count database records?" },
      { role: "assistant", text: "Use an authorized SQL query for exact counts and aggregates. Vector search is useful for approximate semantic matching, but cannot replace the transactional source of truth." },
    ],
  },
  {
    id: "models",
    title: "Local inference options",
    summary: "Windows hardware planning",
    messages: [
      { role: "user", text: "How should I start on a Windows PC with 4 GB VRAM?" },
      { role: "assistant", text: "Start with a small quantized model, one inference request at a time, and a conservative context window. Measure memory and speed before increasing the model size." },
    ],
  },
];

export function findSample(id?: string): SampleConversation | undefined {
  return SAMPLE_CONVERSATIONS.find((item) => item.id === id);
}

export function draftKey(userId: string, sampleId?: string): string {
  return `llm-platform.draft.v1.${userId}.${sampleId ?? "new"}`;
}
