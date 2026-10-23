from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterPayload(BaseModel):
    email: EmailStr
    display_name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=12, max_length=256)

    @field_validator("display_name")
    @classmethod
    def clean_display_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Display name cannot be empty")
        return value


class LoginPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)


class PublicUser(BaseModel):
    id: str
    email: str
    display_name: str
    created_at: datetime

    model_config = {"from_attributes": True}

