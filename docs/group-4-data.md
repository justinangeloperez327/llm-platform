# Group 4 — Tenant-scoped relational data and authorization

## Delivered

- Second Alembic migration (`0002_tenant_data`), safe to apply after existing Group 3 accounts.
- `workspaces`: one personal workspace per account, unique owner ID.
- `workspace_memberships`: role per user/workspace: owner, editor, viewer. No membership-invite endpoint in this group.
- `conversations`: tenant key, creator, title, timestamps.
- `messages`: tenant key, conversation ID, nullable author, role, content, timestamps. A composite foreign key prevents linking a message to a conversation in a different workspace.
- `knowledge_sources`: tenant ownership and ingestion lifecycle metadata only. No file upload or indexing yet.
- Server-side membership enforcement on each list/read/write/delete; foreign workspaces and conversations respond with 404 to avoid disclosing existence; read-only membership gets 403 for writes.
- Bounded list sizes (1–100) and validated title/content lengths. Only user-authored messages may be created through the Group 4 endpoint; no fake assistant/system messages.
- Integration tests for isolation, membership revocation, role transitions, FK rejection, migrations and PostgreSQL persistence.

## API

All private endpoints require an active database-backed `llm_session` cookie. Writes require the allowlisted `Origin` header.

| Method | Route | Permission |
|---|---|---|
| GET | `/api/v1/workspaces` | Current authenticated user |
| GET | `/api/v1/workspaces/{workspace_id}/conversations` | Workspace viewer+ |
| POST | `/api/v1/workspaces/{workspace_id}/conversations` | Workspace editor+ |
| GET | `/api/v1/workspaces/{workspace_id}/conversations/{conversation_id}` | Workspace viewer+ |
| PATCH | `/api/v1/workspaces/{workspace_id}/conversations/{conversation_id}` | Workspace editor+ |
| DELETE | `/api/v1/workspaces/{workspace_id}/conversations/{conversation_id}` | Workspace editor+ |
| GET | `/api/v1/workspaces/{workspace_id}/conversations/{conversation_id}/messages` | Workspace viewer+ |
| POST | `/api/v1/workspaces/{workspace_id}/conversations/{conversation_id}/messages` | Workspace editor+ (user role only) |

No membership invitation, file upload, model response or search is exposed by these APIs yet.

## Running on Windows

From the repository root, start Docker Desktop and run `docker compose up -d --wait db`.
From `services/api`, install and execute `python -m alembic upgrade head`, then run `python -m uvicorn app.main:app --reload --port 8000`. The existing Next.js frontend remains on port 3000 and is still a UI preview. The new persistence API is accessible at `http://127.0.0.1:8000/docs` after authenticating with the same-origin application.

## Isolation model and limitations

Tenant checks run in the FastAPI authorization layer, backed by explicit workspace FKs and membership rows. PostgreSQL row-level security policies are **not yet enabled**, so database credentials must be kept private and future services must not directly query tenant tables without the central authorization policy. Before a multi-tenant production deployment, implement a least-privilege application DB role and DB-enforced RLS or an equivalent audited containment strategy.

Individual personal workspaces are provisioned when registering, and migration `0002` backfills preexisting users; a read-only GET does not mutate database state.

Client-side drafts remain browser-local and are not yet stored in these conversations. Group 5 will connect model-backed chat to persistent conversations. Knowledge source ingestion is Group 6.

## Security considerations

- Do not expose FastAPI directly to untrusted networks in its local-development configuration.
- Every write validates origin. This protects against common browser CSRF but must be complemented by deployment hardening and appropriate trusted-proxy configuration.
- Mutating conversation and message endpoints must never trust a user ID or workspace authorization passed in a request body.
- Database-level FK checks prevent cross-workspace message injection even if the application incorrectly constructs a message row.
- Membership access is checked on each request; revocations take effect on the next request.
