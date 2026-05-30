"""drop roles and chart configurations

Revision ID: b3c4d5e6f7a8
Revises: a1b2c3d4e5f6
Create Date: 2026-05-30 00:00:00.000000

Removes researcher-only features:
- users.role column (and user_role enum)
- charts.configuration_id FK column
- chart_configurations table
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # Drop configuration_id FK + column from charts (if they exist)
    has_col = conn.execute(sa.text(
        "SELECT 1 FROM information_schema.columns "
        "WHERE table_name='charts' AND column_name='configuration_id'"
    )).fetchone()
    if has_col:
        # Drop any FK constraints on configuration_id
        fks = conn.execute(sa.text(
            "SELECT conname FROM pg_constraint "
            "WHERE conrelid='charts'::regclass AND contype='f' "
            "AND conkey @> ARRAY["
            "  (SELECT attnum FROM pg_attribute "
            "   WHERE attrelid='charts'::regclass AND attname='configuration_id')"
            "]::smallint[]"
        )).fetchall()
        for (fk_name,) in fks:
            op.drop_constraint(fk_name, 'charts', type_='foreignkey')
        op.drop_column('charts', 'configuration_id')

    # Drop chart_configurations table if it exists
    has_table = conn.execute(sa.text(
        "SELECT 1 FROM information_schema.tables "
        "WHERE table_name='chart_configurations'"
    )).fetchone()
    if has_table:
        op.drop_index(op.f('ix_chart_configurations_user_id'), table_name='chart_configurations')
        op.drop_table('chart_configurations')

    # Drop role column from users if it exists
    has_role = conn.execute(sa.text(
        "SELECT 1 FROM information_schema.columns "
        "WHERE table_name='users' AND column_name='role'"
    )).fetchone()
    if has_role:
        op.drop_column('users', 'role')

    op.execute(sa.text("DROP TYPE IF EXISTS user_role"))


def downgrade() -> None:
    op.execute(
        "CREATE TYPE user_role AS ENUM ('nguoi_dung', 'nghien_cuu', 'chuyen_gia')"
    )
    op.add_column('users', sa.Column(
        'role',
        sa.Enum('nguoi_dung', 'nghien_cuu', 'chuyen_gia', name='user_role'),
        nullable=False,
        server_default='nguoi_dung',
    ))

    op.create_table(
        'chart_configurations',
        sa.Column('configuration_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('rules', sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('configuration_id'),
    )
    op.create_index(op.f('ix_chart_configurations_user_id'), 'chart_configurations', ['user_id'], unique=False)

    op.add_column('charts', sa.Column('configuration_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'charts_configuration_id_fkey', 'charts', 'chart_configurations',
        ['configuration_id'], ['configuration_id'], ondelete='SET NULL',
    )
