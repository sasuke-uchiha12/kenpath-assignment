"""Initial schema for fictional applications and officer review."""

from alembic import op
import sqlalchemy as sa

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "applications",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("reference", sa.String(30), nullable=False, unique=True),
        sa.Column("applicant", sa.String(100), nullable=False),
        sa.Column("district", sa.String(100), nullable=False),
        sa.Column("address", sa.Text, nullable=False),
        sa.Column("submitted", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("revision", sa.Integer, nullable=False),
        sa.Column("annual_income", sa.Integer, nullable=False),
        sa.Column("occupation", sa.String(100), nullable=False),
        sa.Column("required_documents", sa.JSON, nullable=False),
        sa.Column("attention", sa.JSON, nullable=False),
    )
    op.create_table(
        "documents",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "application_id",
            sa.Integer,
            sa.ForeignKey("applications.id"),
            nullable=False,
        ),
        sa.Column("kind", sa.String(50), nullable=False),
        sa.Column("title", sa.String(100), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
    )
    op.create_table(
        "decisions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "application_id",
            sa.Integer,
            sa.ForeignKey("applications.id"),
            nullable=False,
            unique=True,
        ),
        sa.Column("action", sa.String(20), nullable=False),
        sa.Column("reason", sa.Text, nullable=False),
        sa.Column("language", sa.String(2), nullable=False),
        sa.Column("officer", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "ai_reviews",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "application_id",
            sa.Integer,
            sa.ForeignKey("applications.id"),
            nullable=False,
            unique=True,
        ),
        sa.Column("evidence_hash", sa.String(64), nullable=False),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("output", sa.JSON, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade():
    op.drop_table("ai_reviews")
    op.drop_table("decisions")
    op.drop_table("documents")
    op.drop_table("applications")
