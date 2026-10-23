# Windows setup

Tested development intent: Windows 11, 16 GB system RAM, 4 GB GPU VRAM.

Prerequisites: Node.js **24**, Python **3.12+**, Git, Docker Desktop using WSL2, PowerShell; Ollama optional.

## Install and start

1. Clone this repository, then in PowerShell run: `./scripts/windows/bootstrap.ps1`.
2. Start Docker Desktop and run `docker compose up -d --wait db` from the repo root.
3. Install backend: `cd services/api; python -m venv .venv; ./.venv/Scripts/python.exe -m pip install -e ".[dev]"`.
4. Apply database migration: `./.venv/Scripts/python.exe -m alembic upgrade head`.
5. Run backend: `./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000`.
6. Open another terminal, enter `apps/web`, run `npm ci`, then `npm run dev`.
7. Visit `http://localhost:3000/register` to create an account. FastAPI health: `http://127.0.0.1:8000/api/v1/health`.

Optional inference: install Ollama, run `ollama pull qwen3.5:2b-q4_K_M` and test `ollama run qwen3.5:2b-q4_K_M`. Start at 2048 context tokens. GPU acceleration depends on actual GPU model and driver. Use `ollama ps` to inspect offloading.

## Troubleshooting

- Database port occupied: stop the conflicting local PostgreSQL service or alter localhost-only port mapping and DATABASE_URL.
- Port 8000 occupied: select another port and update the dev URL.
- 16 GB RAM: shut down unneeded containers, limit inference to one request and one loaded model.
- No GPU acceleration: ensure vendor drivers/Ollama support the GPU, otherwise use CPU fallback.
- Docker is optional for fast API unit tests and the frontend.
- No model downloads or services are required on GitHub Actions runners.

## Security

The Compose credentials are *local development defaults only*; update .env for each workstation. Docker listens on loopback, not on the public network. Do not expose Ollama publicly. Never commit .env or model weights.

