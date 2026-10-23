import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher, exceptions as argon_errors
from fastapi import HTTPException, Request, Response, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.auth.models import AuthSession, LoginAttempt, User
from app.config import Settings

hasher = PasswordHasher(time_cost=2, memory_cost=65536, parallelism=2)
# A constant stored hash makes login responses less dependent on account existence.
DUMMY_HASH = hasher.hash("never-a-real-user-password-01")
COOKIE_NAME = "llm_session"
LOGIN_WINDOW = timedelta(minutes=15)
MAX_FAILURES = 5


def normalize_email(email: str) -> str:
    return email.strip().casefold()


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    return hasher.hash(password)


def password_matches(password: str, encoded: str) -> bool:
    try:
        return hasher.verify(encoded, password)
    except (argon_errors.VerifyMismatchError, argon_errors.VerificationError, ValueError):
        return False


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def aware(dt: datetime) -> datetime:
    # SQLite returns naive datetimes even for DateTime(timezone=True).
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def enforce_origin(request: Request, settings: Settings) -> None:
    origin = request.headers.get("origin")
    if origin not in settings.allowed_origins:
        raise HTTPException(status_code=403, detail="Untrusted request origin")


def issue_session(db: Session, user: User, settings: Settings) -> str:
    raw = secrets.token_urlsafe(32)
    db.add(
        AuthSession(
            user_id=user.id,
            token_hash=hash_token(raw),
            expires_at=utc_now() + timedelta(seconds=settings.session_lifetime_seconds),
        )
    )
    return raw


def set_session_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=settings.session_lifetime_seconds,
        path="/",
        secure=settings.session_cookie_secure,
        httponly=True,
        samesite="lax",
    )
    response.headers["Cache-Control"] = "no-store"


def clear_session_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        COOKIE_NAME, path="/", secure=settings.session_cookie_secure, httponly=True,
        samesite="lax"
    )
    response.headers["Cache-Control"] = "no-store"


def current_session(request: Request, db: Session) -> AuthSession:
    token = request.cookies.get(COOKIE_NAME, "")
    if len(token) > 256 or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    session = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_token(token)))
    if session is None or session.revoked_at is not None or aware(session.expires_at) <= utc_now():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return session


def attempt_identity(request: Request, email: str) -> str:
    # Never trust user-provided X-Forwarded-For; the trusted reverse proxy owns this later.
    peer = request.client.host if request.client else "unknown"
    return hashlib.sha256(f"{peer}:{normalize_email(email)}".encode("utf-8")).hexdigest()


def deny_if_limited(db: Session, identity: str) -> None:
    since = utc_now() - LOGIN_WINDOW
    count = db.scalar(
        select(func.count()).select_from(LoginAttempt).where(
            LoginAttempt.identity == identity, LoginAttempt.created_at >= since
        )
    ) or 0
    if count >= MAX_FAILURES:
        raise HTTPException(status_code=429, detail="Too many attempts; try again later")


def record_failed_login(db: Session, identity: str) -> None:
    db.add(LoginAttempt(identity=identity))
    db.commit()


def clear_failed_logins(db: Session, identity: str) -> None:
    db.execute(delete(LoginAttempt).where(LoginAttempt.identity == identity))

