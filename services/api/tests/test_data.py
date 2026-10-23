from datetime import UTC, datetime
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.db import get_db
from app.auth.models import Base
from app.auth.security import COOKIE_NAME
from app.data.models import KnowledgeSource, Message, Workspace, WorkspaceMembership
from app.main import app

ORIGIN = {"Origin": "http://localhost:3000"}


@pytest.fixture()
def context():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def foreign_keys_on(conn, _):
        conn.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)

    def db_provider():
        with Session(engine, expire_on_commit=False) as session:
            yield session

    app.dependency_overrides[get_db] = db_provider
    with TestClient(app) as client:
        yield client, engine
    app.dependency_overrides.clear()
    engine.dispose()


def register(client: TestClient, name: str) -> tuple[str, str]:
    response = client.post(
        "/api/v1/auth/register", headers=ORIGIN,
        json={
            "email": f"{name}@example.com",
            "display_name": name,
            "password": "a-long-development-passphrase-2026",
        },
    )
    assert response.status_code == 201, response.text
    token = client.cookies.get(COOKIE_NAME)
    assert token is not None
    return response.json()["id"], token


def impersonate(client: TestClient, token: str) -> None:
    client.cookies.set(COOKIE_NAME, token)


def workspaces(client: TestClient) -> list[dict]:
    r = client.get("/api/v1/workspaces")
    assert r.status_code == 200, r.text
    return r.json()


def make_conversation(client: TestClient, workspace_id: str, title="Private conversation"):
    return client.post(
        f"/api/v1/workspaces/{workspace_id}/conversations",
        json={"title": title}, headers=ORIGIN,
    )


def test_personal_workspaces_and_conversation_round_trip(context):
    client, engine = context
    first, token = register(client, "first")
    ws = workspaces(client)
    assert len(ws) == 1 and ws[0]["role"] == "owner"
    workspace_id = ws[0]["id"]
    assert ws[0]["name"] == "Personal"
    created = make_conversation(client, workspace_id)
    assert created.status_code == 201, created.text
    conversation_id = created.json()["id"]
    base = f"/api/v1/workspaces/{workspace_id}/conversations/{conversation_id}"
    assert client.get(base).json()["created_by"] == first
    message = client.post(
        base + "/messages", json={"content": "A private prompt"}, headers=ORIGIN
    )
    assert message.status_code == 201, message.text
    assert message.json()["role"] == "user"
    assert client.get(base + "/messages").json()[0]["content"] == "A private prompt"
    renamed = client.patch(base, headers=ORIGIN, json={"title": "Renamed"})
    assert renamed.status_code == 200 and renamed.json()["title"] == "Renamed"
    assert len(client.get(f"/api/v1/workspaces/{workspace_id}/conversations").json()) == 1
    assert client.delete(base, headers=ORIGIN).status_code == 204
    assert client.get(base).status_code == 404
    with Session(engine) as db:
        assert db.scalar(select(Message).where(Message.conversation_id == conversation_id)) is None
    assert token


def test_access_denied_across_users_and_workspace_spoofing(context):
    client, _ = context
    first_id, first_token = register(client, "alice")
    ws1 = workspaces(client)[0]["id"]
    created = make_conversation(client, ws1)
    assert created.status_code == 201
    conversation_id = created.json()["id"]

    second_id, second_token = register(client, "bob")
    ws2 = workspaces(client)[0]["id"]
    assert first_id != second_id and ws1 != ws2
    impersonate(client, second_token)
    assert len(workspaces(client)) == 1
    assert workspaces(client)[0]["id"] == ws2

    base = f"/api/v1/workspaces/{ws1}/conversations"
    assert client.get(base).status_code == 404
    assert make_conversation(client, ws1).status_code == 404
    for path in [f"{base}/{conversation_id}", f"{base}/{conversation_id}/messages"]:
        assert client.get(path).status_code == 404
    assert client.patch(f"{base}/{conversation_id}", headers=ORIGIN,
                        json={"title": "Malicious"}).status_code == 404
    assert client.delete(f"{base}/{conversation_id}", headers=ORIGIN).status_code == 404
    assert client.post(f"{base}/{conversation_id}/messages",
                       headers=ORIGIN, json={"content": "Injection"}).status_code == 404
    assert client.get(f"/api/v1/workspaces/{ws2}/conversations/{conversation_id}").status_code == 404

    impersonate(client, first_token)
    assert client.get(f"{base}/{conversation_id}").status_code == 200


def test_viewer_read_only_and_editor_can_write(context):
    client, engine = context
    first_id, owner = register(client, "owner")
    ws = workspaces(client)[0]["id"]
    conversation_id = make_conversation(client, ws).json()["id"]
    second_id, second = register(client, "viewer")
    with Session(engine) as db:
        db.add(WorkspaceMembership(workspace_id=ws, user_id=second_id, role="viewer"))
        db.commit()

    impersonate(client, second)
    assert len(workspaces(client)) == 2
    base = f"/api/v1/workspaces/{ws}/conversations"
    assert client.get(base).status_code == 200
    assert make_conversation(client, ws).status_code == 403
    assert client.get(f"{base}/{conversation_id}/messages").status_code == 200
    assert client.post(f"{base}/{conversation_id}/messages",
                       headers=ORIGIN, json={"content": "No write"}).status_code == 403

    with Session(engine) as db:
        membership = db.get(WorkspaceMembership, (ws, second_id))
        assert membership is not None
        membership.role = "editor"
        db.commit()
    assert make_conversation(client, ws, "Editor conversation").status_code == 201
    impersonate(client, owner)
    assert client.get(base).status_code == 200
    assert first_id


def test_no_auth_origin_and_input_validation(context):
    client, _ = context
    assert client.get("/api/v1/workspaces").status_code == 401
    register(client, "poster")
    ws = workspaces(client)[0]["id"]
    base = f"/api/v1/workspaces/{ws}/conversations"
    assert client.post(base, json={"title": "No origin"}).status_code == 403
    assert client.post(base, headers={"Origin": "https://evil.example"},
                       json={"title": "Cross-site"}).status_code == 403
    assert make_conversation(client, ws, " ").status_code == 422
    assert make_conversation(client, ws, "x" * 201).status_code == 422
    assert client.get(base, params={"limit": 101}).status_code == 422
    created = make_conversation(client, ws)
    cid = created.json()["id"]
    assert client.post(f"{base}/{cid}/messages", headers=ORIGIN,
                       json={"content": "   "}).status_code == 422
    assert client.post(f"{base}/{cid}/messages", headers=ORIGIN,
                       json={"content": "x" * 20001}).status_code == 422
    assert client.post(f"{base}/{cid}/messages", headers=ORIGIN,
                       json={"content": "fake", "role": "assistant"}).status_code == 422


def test_composite_fk_rejects_cross_workspace_message(context):
    client, engine = context
    _, token1 = register(client, "fkone")
    ws1 = workspaces(client)[0]["id"]
    conversation_id = make_conversation(client, ws1).json()["id"]
    _, _ = register(client, "fktwo")
    ws2 = workspaces(client)[0]["id"]

    with Session(engine) as db:
        row = Message(
            id=str(uuid4()), workspace_id=ws2, conversation_id=conversation_id,
            role="user", content="should never attach",
            created_at=datetime.now(UTC),
        )
        db.add(row)
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()
        db.add(KnowledgeSource(workspace_id=ws2, filename="manual.pdf",
                               content_type="application/pdf", status="pending"))
        db.commit()
    impersonate(client, token1)
    assert workspaces(client)[0]["id"] == ws1


def test_membership_revocation_immediately_blocks_access(context):
    client, engine = context
    _, owner = register(client, "root")
    ws = workspaces(client)[0]["id"]
    _, invited = register(client, "invited")
    with Session(engine) as db:
        invited_user_id = db.scalar(select(WorkspaceMembership.user_id).where(
            WorkspaceMembership.role == "owner",
            WorkspaceMembership.workspace_id != ws
        ))
        assert invited_user_id is not None
        db.add(WorkspaceMembership(workspace_id=ws, user_id=invited_user_id,
                                    role="viewer"))
        db.commit()
        assert db.get(Workspace, ws) is not None
    impersonate(client, invited)
    assert client.get(f"/api/v1/workspaces/{ws}/conversations").status_code == 200
    with Session(engine) as db:
        record = db.get(WorkspaceMembership, (ws, invited_user_id))
        assert record is not None
        db.delete(record)
        db.commit()
    assert client.get(f"/api/v1/workspaces/{ws}/conversations").status_code == 404
    impersonate(client, owner)
    assert client.get(f"/api/v1/workspaces/{ws}/conversations").status_code == 200

