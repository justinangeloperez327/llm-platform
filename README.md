# LLM Platform

**Group 2 complete:** responsive chat drafting workspace, example conversations, browser-local appearance and response-style preferences, desktop/mobile Playwright regression tests. Inference responses are intentionally not available until Group 5. No automatic deployment.

Windows-first, locally hosted LLM development monorepo.

## Group 1 scope

- Next.js 16 / TypeScript frontend on port 3000 (workspace at /chat, settings at /settings)
- FastAPI backend on port 8000
- PostgreSQL 17 + pgvector in Docker Desktop
- Ollama inference adapter (native Windows, *not* required for backend health tests)
- GitHub Actions, Pytest and Vitest checks
- No automatic publishing or deployment

## Quick start (Windows PowerShell)

Prerequisites: Node.js 24, Python 3.12+, Docker Desktop/WSL2 and optionally Ollama.

```powershell
git clone https://github.com/justinangeloperez327/llm-platform.git
cd llm-platform
Copy-Item .env.example .env
docker compose up -d db
cd services/api
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

In another terminal:

```powershell
cd llm-platform\apps\web
npm ci
npm run dev
```

Open http://localhost:3000 and http://127.0.0.1:8000/docs.

For the optional model smoke test:

```powershell
ollama pull qwen3.5:2b-q4_K_M
ollama run qwen3.5:2b-q4_K_M
```

The API includes `/api/v1/health` and an opt-in Ollama status endpoint. Chat streaming, authentication and RAG are deferred to later implementation groups.

**Security:** Local development only. Do not expose PostgreSQL or Ollama publicly or commit real credentials.

See [Windows setup](docs/windows.md), [Group 2 frontend](docs/group-2-frontend.md), [architecture](docs/architecture.md), and [group plan](docs/groups.md).
