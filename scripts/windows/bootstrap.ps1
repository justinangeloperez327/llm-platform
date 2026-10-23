# Run from the repository root: .\scripts\windows\bootstrap.ps1
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $Root

Write-Host "LLM Platform — Windows prerequisites" -ForegroundColor Cyan
foreach ($Command in @("node", "npm", "python", "docker")) {
  if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
    Write-Warning "$Command not found in PATH"
  } else {
    Write-Host "$Command available"
  }
}

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created local .env (development-only defaults)."
}

Write-Host "Next: docker compose up -d db"
Write-Host "Backend: cd services/api; python -m pip install -e '.[dev]'; python -m alembic upgrade head; python -m uvicorn app.main:app --reload --port 8000"
Write-Host "Frontend: cd apps/web; npm ci; npm run dev"
Write-Host "Optional Ollama: ollama pull qwen3.5:2b-q4_K_M"

