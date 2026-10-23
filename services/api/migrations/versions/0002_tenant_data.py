"""Personal workspaces and tenant-scoped conversation/message/source metadata.

Revision ID: 0002_tenant_data
Revises: 0001_auth
"""

from collections.abc import Sequence
from datetime import UTC, datetime
from uuid import uuid4

import sqlalchemy as sa
from alembic import op

revision: str = "0002_tenant_data"
down_revision: str | None = "0001_auth"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "workspaces",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("owner_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "workspace_memberships",
        sa.Column("workspace_id", sa.String(36),
                  sa.ForeignKey("workspaces.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("user_id", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("role", sa.String(16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("role IN ('owner', 'editor', 'viewer')", name="ck_membership_role"),
    )
    op.create_table(
        "conversations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("workspace_id", sa.String(36),
                  sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("workspace_id", "id", name="uq_conversations_workspace_id_id"),
    )
    op.create_index("ix_conversations_workspace_created", "conversations",
                    ["workspace_id", "created_at"])
    op.create_table(
        "messages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("workspace_id", sa.String(36), nullable=False),
        sa.Column("conversation_id", sa.String(36), nullable=False),
        sa.Column("author_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("role", sa.String(16), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["workspace_id", "conversation_id"],
            ["conversations.workspace_id", "conversations.id"],
            name="fk_messages_scoped_conversation", ondelete="CASCADE",
        ),
        sa.CheckConstraint("role IN ('user', 'assistant', 'system')", name="ck_message_role"),
    )
    op.create_index("ix_messages_conversation_created", "messages",
                    ["conversation_id", "created_at"])
    op.create_table(
        "knowledge_sources",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("workspace_id", sa.String(36),
                  sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("uploaded_by", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("content_type", sa.String(120), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("object_key", sa.String(512)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "status IN ('pending', 'processing', 'ready', 'failed', 'deleted')",
            name="ck_knowledge_status",
        ),
    )
    op.create_index("ix_sources_workspace_created", "knowledge_sources",
                    ["workspace_id", "created_at"])

    # Existing Group 3 accounts receive a private workspace without requiring re-registration.
    connection = op.get_bind()
    now = datetime.now(UTC)
    for (user_id,) in connection.execute(sa.text("SELECT id FROM users")):
        workspace_id = str(uuid4())
        connection.execute(
            sa.text("INSERT INTO workspaces (id, name, owner_id, created_at) "
                    "VALUES (:id, :name, :owner_id, :created_at)"),
            {"id": workspace_id, "name": "Personal", "owner_id": user_id, "created_at": now},
        )
        connection.execute(
            sa.text("INSERT INTO workspace_memberships "
                    "(workspace_id, user_id, role, created_at) "
                    "VALUES (:workspace_id, :user_id, 'owner', :created_at)"),
            {"workspace_id": workspace_id, "user_id": user_id, "created_at": now},
        )


def downgrade() -> None:
    op.drop_index("ix_sources_workspace_created", table_name="knowledge_sources")
    op.drop_table("knowledge_sources")
    op.drop_index("ix_messages_conversation_created", table_name="messages")
    op.drop_table("messages")
    op.drop_index("ix_conversations_workspace_created", table_name="conversations")
    op.drop_table("conversations")
    op.drop_table("workspace_memberships")
    op.drop_table("workspaces")

