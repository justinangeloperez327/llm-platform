import asyncio

import httpx
import pytest
from pydantic import ValidationError

from app.inference.ollama import InferenceProviderError, OllamaProvider
from app.inference.types import ChatMessage, GenerationOptions


def test_generation_options_validate_memory_bounds() -> None:
    with pytest.raises(ValidationError):
        GenerationOptions(context_tokens=0)
    with pytest.raises(ValidationError):
        GenerationOptions(max_output_tokens=0)


def test_ollama_payload_has_bounded_context(monkeypatch: pytest.MonkeyPatch) -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            status_code=200,
            json={"model": "qwen3.5:2b-q4_K_M", "message": {"content": "Hello!"}},
        )

    real_client = httpx.AsyncClient

    def mock_client(*args: object, **kwargs: object) -> httpx.AsyncClient:
        kwargs["transport"] = httpx.MockTransport(handler)
        return real_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", mock_client)
    model = OllamaProvider("http://127.0.0.1:11434/", "qwen3.5:2b-q4_K_M")
    result = asyncio.run(
        model.complete(
            [ChatMessage(role="user", content="Hello")],
            GenerationOptions(context_tokens=2048, max_output_tokens=256),
        )
    )
    assert result.content == "Hello!"
    assert len(requests) == 1
    assert requests[0].url.path == "/api/chat"
    import json

    payload = json.loads(requests[0].content)
    assert payload["options"]["num_ctx"] == 2048
    assert payload["options"]["num_predict"] == 256
    assert payload["stream"] is False


def test_invalid_model_response_is_wrapped(monkeypatch: pytest.MonkeyPatch) -> None:
    real_client = httpx.AsyncClient

    def mock_client(*args: object, **kwargs: object) -> httpx.AsyncClient:
        kwargs["transport"] = httpx.MockTransport(
            lambda _: httpx.Response(200, json={"invalid": True})
        )
        return real_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", mock_client)
    provider = OllamaProvider("http://127.0.0.1:11434", "test")
    with pytest.raises(InferenceProviderError):
        asyncio.run(
            provider.complete(
                [ChatMessage(role="user", content="Hi")], GenerationOptions()
            )
        )

