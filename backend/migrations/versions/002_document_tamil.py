"""Add an optional Tamil rendering of fictional sample evidence."""

from alembic import op
import sqlalchemy as sa

revision = "002_document_tamil"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("documents", sa.Column("content_ta", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("documents", "content_ta")
