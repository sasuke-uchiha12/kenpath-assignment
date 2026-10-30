from alembic import context
from app import db, models

config = context.config
target_metadata = db.Base.metadata
if context.is_offline_mode():
    context.configure(url=str(db.engine.url), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()
else:
    with db.engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
