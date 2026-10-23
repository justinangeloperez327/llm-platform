from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.db import get_db
from app.auth.models import User
from app.auth.security import current_session, enforce_origin
from app.config import Settings
from app.data.models import Conversation, Message, Workspace, WorkspaceMembership
from app.data.policy import conversation_or_404, membership_or_404
from app.data.schemas import (
    ConversationCreate,
    ConversationRename,
    ConversationView,
    MessageCreate,
    MessageView,
    WorkspaceView,
)

router = APIRouter(prefix="/api/v1/workspaces", tags=["workspaces"])
Db = Annotated[Session, Depends(get_db)]


def get_user(request: Request, db: Db) -> User:
    return current_session(request, db).user


CurrentUser = Annotated[User, Depends(get_user)]


def check_write_origin(request: Request) -> None:
    enforce_origin(request, Settings())


@router.get("", response_model=list[WorkspaceView])
def list_workspaces(db: Db, user: CurrentUser, response: Response) -> list[WorkspaceView]:
    rows = db.execute(
        select(Workspace, WorkspaceMembership.role)
        .join(WorkspaceMembership, Workspace.id == WorkspaceMembership.workspace_id)
        .where(WorkspaceMembership.user_id == user.id)
        .order_by(Workspace.created_at.asc())
    ).all()
    response.headers["Cache-Control"] = "no-store"
    return [WorkspaceView(id=workspace.id, name=workspace.name, role=role)
            for workspace, role in rows]


@router.get("/{workspace_id}/conversations", response_model=list[ConversationView])
def list_conversations(
    workspace_id: str, db: Db, user: CurrentUser, response: Response,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[Conversation]:
    membership_or_404(db, user, workspace_id)
    response.headers["Cache-Control"] = "no-store"
    return list(db.scalars(
        select(Conversation).where(Conversation.workspace_id == workspace_id)
        .order_by(Conversation.created_at.desc(), Conversation.id.desc()).limit(limit)
    ).all())


@router.post("/{workspace_id}/conversations", response_model=ConversationView, status_code=201)
def create_conversation(
    workspace_id: str, payload: ConversationCreate, request: Request,
    db: Db, user: CurrentUser,
) -> Conversation:
    check_write_origin(request)
    membership_or_404(db, user, workspace_id, "write")
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Conversation title cannot be blank")
    row = Conversation(workspace_id=workspace_id, created_by=user.id, title=title)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/{workspace_id}/conversations/{conversation_id}", response_model=ConversationView)
def get_conversation(
    workspace_id: str, conversation_id: str, db: Db, user: CurrentUser, response: Response
) -> Conversation:
    row = conversation_or_404(db, user, workspace_id, conversation_id)
    response.headers["Cache-Control"] = "no-store"
    return row


@router.patch("/{workspace_id}/conversations/{conversation_id}", response_model=ConversationView)
def rename_conversation(
    workspace_id: str, conversation_id: str, payload: ConversationRename,
    request: Request, db: Db, user: CurrentUser,
) -> Conversation:
    check_write_origin(request)
    row = conversation_or_404(db, user, workspace_id, conversation_id, "write")
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Conversation title cannot be blank")
    row.title = title
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{workspace_id}/conversations/{conversation_id}", status_code=204)
def delete_conversation(
    workspace_id: str, conversation_id: str, request: Request, response: Response,
    db: Db, user: CurrentUser,
) -> None:
    check_write_origin(request)
    row = conversation_or_404(db, user, workspace_id, conversation_id, "write")
    db.delete(row)
    db.commit()
    response.headers["Cache-Control"] = "no-store"


@router.get("/{workspace_id}/conversations/{conversation_id}/messages",
            response_model=list[MessageView])
def list_messages(
    workspace_id: str, conversation_id: str, db: Db, user: CurrentUser,
    response: Response, limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[Message]:
    conversation_or_404(db, user, workspace_id, conversation_id)
    response.headers["Cache-Control"] = "no-store"
    return list(db.scalars(
        select(Message).where(
            Message.workspace_id == workspace_id, Message.conversation_id == conversation_id
        ).order_by(Message.created_at.asc(), Message.id.asc()).limit(limit)
    ).all())


@router.post("/{workspace_id}/conversations/{conversation_id}/messages",
             response_model=MessageView, status_code=201)
def add_user_message(
    workspace_id: str, conversation_id: str, payload: MessageCreate,
    request: Request, db: Db, user: CurrentUser,
) -> Message:
    check_write_origin(request)
    conversation_or_404(db, user, workspace_id, conversation_id, "write")
    if not payload.content.strip():
        raise HTTPException(status_code=422, detail="Message cannot be blank")
    row = Message(
        workspace_id=workspace_id, conversation_id=conversation_id,
        author_id=user.id, role="user", content=payload.content,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


