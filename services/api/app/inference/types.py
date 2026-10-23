from typing import Literal, Protocol

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(min_length=1, max_length=100_000)


class GenerationOptions(BaseModel):
    context_tokens: int = Field(default=2048, ge=256, le=131072)
    max_output_tokens: int = Field(default=256, ge=1, le=8192)
    temperature: float = Field(default=0.2, ge=0, le=2)


class Completion(BaseModel):
    model: str
    content: str


class InferenceProvider(Protocol):
    async def available(self) -> bool: ...

    async def complete(
        self, messages: list[ChatMessage], options: GenerationOptions
    ) -> Completion: ...

