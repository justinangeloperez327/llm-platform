from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_is_available_without_database_or_gpu() -> None:
    result = client.get("/api/v1/health")
    assert result.status_code == 200
    assert result.json() == {
        "status": "ok",
        "service": "llm-platform-api",
        "version": "0.4.0",
    }


def test_openapi_documents_health_and_inference_status() -> None:
    result = client.get("/openapi.json")
    assert result.status_code == 200
    assert "/api/v1/health" in result.json()["paths"]
    assert "/api/v1/inference/status" in result.json()["paths"]
    assert "/api/v1/auth/register" in result.json()["paths"]


def test_cors_does_not_allow_arbitrary_origin() -> None:
    result = client.get(
        "/api/v1/health", headers={"Origin": "https://not-allowed.example"}
    )
    assert "access-control-allow-origin" not in result.headers

