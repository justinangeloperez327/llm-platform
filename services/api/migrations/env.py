from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.auth.models import Base
from app.config import Settings

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def db_url() -> str:
    raw = Settings().database_url
    return "postgresql+psycopg://" + raw[len("postgresql://"):] if raw.startswith("postgresql://") else raw


def run_migrations_offline() -> None:
    context.configure(url=db_url(), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = engine_from_config(
        {"sqlalchemy.url": db_url()}, prefix="sqlalchemy.", poolclass=pool.NullPool
    )
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

