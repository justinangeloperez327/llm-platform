import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, select
from sqlalchemy.orm import Session

from app.auth.models import AuthSession, User
from app.config import Settings
from app.main import app


@pytest.mark.postgres
def test_migrated_postgres_and_auth_roundtrip():
    if os.getenv("RUN_POSTGRES_AUTH_TEST") != "1":
        pytest.skip("Only run against a CI-managed PostgreSQL test database")
    uri = Settings().database_url
    engine = create_engine(uri)
    inspector = inspect(engine)
    assert {"users", "auth_sessions", "login_attempts"}.issubset(
        set(inspector.get_table_names())
    )
    unique_email = f"ci-{uuid4().hex}@example.test"
    with TestClient(app) as client:
        result = client.post(
            "/api/v1/auth/register",
            headers={"Origin": "http://localhost:3000"},
            json={
                "email": unique_email, "display_name": "Postgres CI",
                "password": "a-long-strong-development-passphrase",
            },
        )
        assert result.status_code == 201, result.text
        assert client.get("/api/v1/auth/me").status_code == 200
        assert client.post(
            "/api/v1/auth/logout", headers={"Origin": "http://localhost:3000"}
        ).status_code == 204
        assert client.get("/api/v1/auth/me").status_code == 401
    with Session(engine) as db:
        user = db.scalar(select(User).where(User.email == unique_email))
        assert user is not None
        sessions = db.scalars(select(AuthSession).where(AuthSession.user_id == user.id)).all()
        assert sessions and all(row.revoked_at is not None for row in sessions)
        db.delete(user)
        db.commit()
    engine.dispose()

