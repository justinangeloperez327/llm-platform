# Group 2: Chat workspace frontend

## Scope

- Responsive navigation: desktop sidebar and accessible mobile navigation drawer with Escape, keyboard focus loop and returned trigger focus
- Chat workspace for prompt drafting; sample threads are explicitly marked illustrative
- Per-thread local prompt drafts (localStorage); nothing is submitted to inference yet
- Preferences: dark/light, compact/comfortable, future response-style selection, and reset
- Static model configuration reference: Ollama, Qwen3.5 2B Q4, 2048 context
- Vitest unit coverage for preferences and sample selection
- Playwright Chromium desktop/mobile regression tests
- No authentication, backend chat, token streaming, document upload, agent actions, or auto deployment

## Routes

| Route | Behavior |
|---|---|
| / | Redirects to /chat |
| /chat | Empty prompt drafting |
| /chat?sample=rag | Illustrative RAG sample |
| /chat?sample=routing | Illustrative SQL-vs-vector example |
| /chat?sample=models | Illustrative hardware example |
| /settings | Browser-local appearance and preview preferences |

## Local tests

From `apps/web` run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
For browser smoke tests run `npx playwright install chromium`, then `npm run test:e2e`.

## Security note

Sample conversations are hard-coded examples; no model requests or externally sourced content are made. Drafts are browser-local, not encrypted, not synchronized, and should not contain secrets. Later backend authorization must not trust frontend preference or routing state.
