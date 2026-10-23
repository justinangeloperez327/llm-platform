import httpx

from app.inference.types import ChatMessage, Completion, GenerationOptions


class InferenceProviderError(Exception):
    """Model server is unreachable or returned an invalid response."""


class OllamaProvider:
    def __init__(self, base_url: str, model: str, timeout: float = 30.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._timeout = timeout

    async def available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                response = await client.get(f"{self._base_url}/api/tags")
                return response.status_code == 200
        except httpx.RequestError:
            return False

    async def complete(
        self, messages: list[ChatMessage], options: GenerationOptions
    ) -> Completion:
        payload = {
            "model": self._model,
            "messages": [m.model_dump() for m in messages],
            "stream": False,
            "think": False,
            "options": {
                "num_ctx": options.context_tokens,
                "num_predict": options.max_output_tokens,
                "temperature": options.temperature,
            },
            "keep_alive": "2m",
        }
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(f"{self._base_url}/api/chat", json=payload)
                response.raise_for_status()
                data = response.json()
            content = data["message"]["content"]
            if not isinstance(content, str):
                raise (TypeError("model returned non-text content"))
            return Completion(model=data.get("model", self._model), content=content)
        except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
            raise InferenceProviderError("Ollama completion failed") from exc

