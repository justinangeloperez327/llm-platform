from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.db import get_db
from app.auth.models import AuthSession, Base, User
from app.auth.security import COOKIE_NAME, hash_token, utc_now
from app.config import Settings
from app.main import app

ORIGIN = {"Origin": "http://localhost:3000"}
ACCOUNT = {
    "email": "Developer@Example.com",
    "display_name": "Test Developer",
    "password": "a-long-strong-development-passphrase",
}


@pytest.fixture()
def api() -> TestClient:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)

    def test_db():
        with Session(engine, expire_on_commit=False) as db:
            yield db

    app.dependency_overrides[get_db] = test_db
    with TestClient(app) as client:
        client.app.state.auth_test_engine = engine
        yield client
    app.dependency_overrides.clear()
    engine.dispose()


def register(api: TestClient):
    return api.post("/api/v1/auth/register", headers=ORIGIN, json=ACCOUNT)


def test_register_creates_cookie_and_me(api: TestClient):
    result = register(api)
    assert result.status_code == 201
    assert result.json()["email"] == "developer@example.com"
    assert "password" not in result.json()
    assert "password_hash" not in result.json()
    cookie = result.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=lax" in cookie
    assert "max-age=" in cookie
    response = api.get("/api/v1/auth/me")
    assert response.status_code == 200
    assert response.json()["id"] == result.json()["id"]
    assert response.headers["cache-control"] == "no-store"

    with Session(api.app.state.auth_test_engine) as db:
        user = db.scalar(select(User))
        assert user is not None and user.password_hash != ACCOUNT["password"]
        token = api.cookies.get(COOKIE_NAME)
        assert token is not None
        session = db.scalar(select(AuthSession))
        assert session is not None
        assert session.token_hash == hash_token(token)
        assert token not in session.token_hash
        from app.data.models import Workspace, WorkspaceMembership

        workspace = db.scalar(select(Workspace).where(Workspace.owner_id == user.id))
        assert workspace is not None
        membership = db.get(WorkspaceMembership, (workspace.id, user.id))
        assert membership is not None and membership.role == "owner"


def test_login_logout_and_server_side_revocation(api: TestClient):
    assert register(api).status_code == 201
    original_token = api.cookies.get(COOKIE_NAME)
    assert api.post("/api/v1/auth/logout", headers=ORIGIN).status_code == 204
    assert api.get("/api/v1/auth/me").status_code == 401
    assert api.post(
        "/api/v1/auth/login", headers=ORIGIN,
        json={"email": ACCOUNT["email"], "password": ACCOUNT["password"]},
    ).status_code == 200
    assert api.get("/api/v1/auth/me").status_code == 200
    api.cookies.set(COOKIE_NAME, original_token)
    assert api.get("/api/v1/auth/me").status_code == 401


def test_rejects_duplicate_case_insensitive_email(api: TestClient):
    assert register(api).status_code == 201
    other = {**ACCOUNT, "email": "DEVELOPER@example.com"}
    assert api.post("/api/v1/auth/register", headers=ORIGIN, json=other).status_code == 409


def test_rejects_cross_site_post_even_when_cookie_present(api: TestClient):
    assert api.post(
        "/api/v1/auth/register",
        headers={"Origin": "https://malicious.invalid"}, json=ACCOUNT,
    ).status_code == 403
    assert register(api).status_code == 201
    assert api.post("/api/v1/auth/logout").status_code == 403
    assert api.get("/api/v1/auth/me").status_code == 200


def test_failed_login_limited_and_generic(api: TestClient):
    for _ in range(5):
        result = api.post(
            "/api/v1/auth/login", headers=ORIGIN,
            json={"email": "missing@example.com", "password": "invalid-long-password"},
        )
        assert result.status_code == 401
        assert result.json()["detail"] == "Invalid email or password"
    locked = api.post(
        "/api/v1/auth/login", headers=ORIGIN,
        json={"email": "missing@example.com", "password": "invalid-long-password"},
    )
    assert locked.status_code == 429


def test_expired_session_is_rejected(api: TestClient):
    assert register(api).status_code == 201
    with Session(api.app.state.auth_test_engine) as db:
        session = db.scalar(select(AuthSession))
        assert session is not None
        session.expires_at = utc_now() - timedelta(seconds=1)
        db.commit()
    assert api.get("/api/v1/auth/me").status_code == 401


def test_invalid_registration_password_rejected(api: TestClient):
    result = api.post(
        "/api/v1/auth/register", headers=ORIGIN, json={**ACCOUNT, "password": "short"},
    )
    assert result.status_code == 422


def test_production_requires_secure_cookies():
    with pytest.raises(ValueError, match="SESSION_COOKIE_SECURE"):
        Settings(app_env="production", session_cookie_secure=False)
    assert Settings(app_env="production", session_cookie_secure=True).session_cookie_secure


