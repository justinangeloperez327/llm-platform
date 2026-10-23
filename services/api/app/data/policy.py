from typing import Literal

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.models import User
from app.data.models import Conversation, WorkspaceMembership

Permission = Literal["read", "write", "admin"]


def membership_or_404(
    db: Session, user: User, workspace_id: str, permission: Permission = "read"
) -> WorkspaceMembership:
    # All tenancy checks are server-side; the client never supplies its user identity.
    membership = db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == user.id,
        )
    )
    if membership is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    allowed_roles = {
        "read": {"owner", "editor", "viewer"},
        "write": {"owner", "editor"},
        "admin": {"owner"},
    }
    if membership.role not in allowed_roles[permission]:
        raise HTTPException(status_code=403, detail="Insufficient workspace permission")
    return membership


def conversation_or_404(db: Session, user: User, workspace_id: str, conversation_id: str,
                        permission: Permission = "read") -> Conversation:
    membership_or_404(db, user, workspace_id, permission)
    conversation = db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id, Conversation.workspace_id == workspace_id
        )
    )
    if conversation is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    return conversation

