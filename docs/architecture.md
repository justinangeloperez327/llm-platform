# Architecture decisions — Group 1

- **Windows-first:** Next.js and FastAPI run natively; PostgreSQL with pgvector runs inside Docker Desktop/WSL2.
- **Inference-neutral API:** `InferenceProvider` is a Python Protocol. Ollama implements availability and completion; a vLLM adapter can be added on Linux later.
- **Bounded inference defaults:** Qwen3.5 2B Q4, context 2048, max output 256, temperature 0.2, one concurrent request.
- **Separation:** Model artifacts, UI and application state are not stored together.
- **Source-of-truth strategy:** PostgreSQL for relational data; keyword and vector retrieval follow in Groups 6–10, not in the Group 1 serving path.
- **Data boundary:** Model does not select authorization. Future SQL/code/document retrieval must be authorized server-side.
- **No training yet:** Group 19 is a separate research phase, not part of Group 1.
- **No auto deployment:** CI validates; deploy and model downloads require an explicit operator action.

## Deferred work

Full chat API and streaming (Group 5), authentication (Group 3), domain schema and row-level security (Group 4), full RAG (Groups 6–10), agent execution (Group 12).

