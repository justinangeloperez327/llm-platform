from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.auth.router import router as auth_router
from app.config import Settings
from app.data.router import router as data_router
from app.inference.ollama import OllamaProvider

settings = Settings()
app = FastAPI(
    title="LLM Platform API",
    version="0.4.0",
    description="Group 4: tenant-scoped conversation storage and resource authorization; inference in Group 5.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.include_router(auth_router)
app.include_router(data_router)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class InferenceStatusResponse(BaseModel):
    provider: str
    model: str
    available: bool


@app.get("/api/v1/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="llm-platform-api", version="0.4.0")


@app.get("/api/v1/inference/status", response_model=InferenceStatusResponse, tags=["inference"])
async def inference_status() -> InferenceStatusResponse:
    provider = OllamaProvider(settings.ollama_base_url, settings.ollama_model)
    return InferenceStatusResponse(
        provider="ollama",
        model=settings.ollama_model,
        available=await provider.available(),
    )


