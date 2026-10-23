from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import Settings


@lru_cache(maxsize=1)
def session_factory() -> sessionmaker[Session]:
    uri = Settings().database_url
    if uri.startswith("postgresql://"):
        uri = "postgresql+psycopg://" + uri[len("postgresql://"):]
    engine = create_engine(uri, pool_pre_ping=True)
    return sessionmaker(engine, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    with session_factory()() as session:
        yield session

