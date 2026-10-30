import os
from alembic import context
from sqlalchemy import create_engine
from app import db, models

config = context.config
target_metadata = db.Base.metadata
direct_url = os.getenv("DATABASE_URL_UNPOOLED")
if direct_url:
    if direct_url.startswith("postgres://"):
        direct_url = direct_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif direct_url.startswith("postgresql://"):
        direct_url = direct_url.replace("postgresql://", "postgresql+psycopg://", 1)
    migration_engine = create_engine(direct_url, pool_pre_ping=True)
else:
    migration_engine = db.engine
if context.is_offline_mode():
    context.configure(
        url=str(migration_engine.url),
        target_metadata=target_metadata,
        literal_binds=True,
    )
    with context.begin_transaction():
        context.run_migrations()
else:
    with migration_engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
