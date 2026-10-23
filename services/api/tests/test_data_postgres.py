import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, select
from sqlalchemy.orm import Session

from app.auth.models import User
from app.config import Settings
from app.data.models import Conversation, Message, Workspace, WorkspaceMembership
from app.main import app

ORIGIN = {"Origin": "http://localhost:3000"}


@pytest.mark.postgres
def test_tenant_isolation_on_migrated_postgresql():
    if os.getenv("RUN_POSTGRES_AUTH_TEST") != "1":
        pytest.skip("Requires migrated local PostgreSQL in CI")

    engine = create_engine(Settings().database_url)
    names = set(inspect(engine).get_table_names())
    assert {"workspaces", "workspace_memberships", "conversations", "messages",
            "knowledge_sources"}.issubset(names)
    alice_email = f"group4-a-{uuid4().hex}@example.com"
    bob_email = f"group4-b-{uuid4().hex}@example.com"
    password = "long-group4-integration-passphrase"

    with TestClient(app) as browser:
        def register(email: str) -> tuple[str, str]:
            resp = browser.post(
                "/api/v1/auth/register", headers=ORIGIN,
                json={"email": email, "display_name": "Group Four", "password": password},
            )
            assert resp.status_code == 201, resp.text
            workspace = browser.get("/api/v1/workspaces")
            assert workspace.status_code == 200
            return resp.json()["id"], workspace.json()[0]["id"]

        alice, ws_alice = register(alice_email)
        created = browser.post(f"/api/v1/workspaces/{ws_alice}/conversations",
                               json={"title": "Private"}, headers=ORIGIN)
        assert created.status_code == 201, created.text
        conv = created.json()["id"]
        msg = browser.post(f"/api/v1/workspaces/{ws_alice}/conversations/{conv}/messages",
                           json={"content": "Owned by Alice"}, headers=ORIGIN)
        assert msg.status_code == 201, msg.text
        bob, ws_bob = register(bob_email)
        assert ws_bob != ws_alice
        assert browser.get(f"/api/v1/workspaces/{ws_alice}/conversations").status_code == 404
        assert browser.get(
            f"/api/v1/workspaces/{ws_bob}/conversations/{conv}/messages"
        ).status_code == 404

    with Session(engine) as db:
        assert db.scalar(select(Message).where(Message.conversation_id == conv)) is not None
        assert db.scalar(select(Conversation).where(Conversation.id == conv)) is not None
        assert db.get(WorkspaceMembership, (ws_alice, alice)) is not None
        assert db.get(WorkspaceMembership, (ws_bob, bob)) is not None
        for email in (alice_email, bob_email):
            user = db.scalar(select(User).where(User.email == email))
            assert user is not None
            db.delete(user)
        # Foreign key ON DELETE RESTRICT for created_by requires deleting conversations first.
        db.delete(db.get(Conversation, conv))
        db.commit()
        assert db.scalar(select(Workspace).where(Workspace.id == ws_alice)) is None
        assert db.scalar(select(Message).where(Message.conversation_id == conv)) is None
    engine.dispose()

