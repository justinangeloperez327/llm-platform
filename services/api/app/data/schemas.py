from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class WorkspaceView(BaseModel):
    id: str
    name: str
    role: Literal["owner", "editor", "viewer"]
    model_config = ConfigDict(from_attributes=True)


class ConversationCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200, strict=True)


class ConversationRename(ConversationCreate):
    pass


class ConversationView(BaseModel):
    id: str
    workspace_id: str
    created_by: str
    title: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MessageCreate(BaseModel):
    # Only human-written messages are accepted in Group 4.
    content: str = Field(min_length=1, max_length=20000, strict=True)


class MessageView(BaseModel):
    id: str
    conversation_id: str
    role: Literal["user", "assistant", "system"]
    content: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

