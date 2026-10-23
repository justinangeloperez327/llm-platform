from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.db import get_db
from app.auth.models import AuthSession, User
from app.auth.schemas import LoginPayload, PublicUser, RegisterPayload
from app.auth.security import (
    DUMMY_HASH,
    attempt_identity,
    clear_failed_logins,
    clear_session_cookie,
    current_session,
    deny_if_limited,
    enforce_origin,
    hash_password,
    issue_session,
    normalize_email,
    password_matches,
    record_failed_login,
    set_session_cookie,
    utc_now,
)
from app.config import Settings

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


def get_settings() -> Settings:
    return Settings()


@router.post("/register", response_model=PublicUser, status_code=201)
def register(
    payload: RegisterPayload,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    enforce_origin(request, settings)
    email = normalize_email(str(payload.email))
    user = User(email=email, display_name=payload.display_name, password_hash=hash_password(payload.password))
    db.add(user)
    try:
        db.flush()  # Unique-email constraint is authoritative even on simultaneous requests.
        raw = issue_session(db, user, settings)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email is already registered") from exc
    set_session_cookie(response, raw, settings)
    return user


@router.post("/login", response_model=PublicUser)
def login(
    payload: LoginPayload,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    enforce_origin(request, settings)
    email = normalize_email(str(payload.email))
    identity = attempt_identity(request, email)
    deny_if_limited(db, identity)
    user = db.scalar(select(User).where(User.email == email))
    if not password_matches(payload.password, user.password_hash if user else DUMMY_HASH) or user is None:
        record_failed_login(db, identity)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    clear_failed_logins(db, identity)
    raw = issue_session(db, user, settings)
    db.commit()
    set_session_cookie(response, raw, settings)
    return user


@router.get("/me", response_model=PublicUser)
def me(request: Request, response: Response, db: Session = Depends(get_db)) -> User:
    session = current_session(request, db)
    response.headers["Cache-Control"] = "no-store"
    return session.user


@router.post("/logout", status_code=204)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> None:
    enforce_origin(request, settings)
    try:
        session: AuthSession = current_session(request, db)
    except HTTPException:
        session = None  # type: ignore[assignment]
    if session is not None:
        session.revoked_at = utc_now()
        db.commit()
    clear_session_cookie(response, settings)

