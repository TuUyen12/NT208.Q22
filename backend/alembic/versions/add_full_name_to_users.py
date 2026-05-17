"""add full_name to users

Revision ID: a1b2c3d4e5f6
Revises: 5ee7f6aca042
Create Date: 2026-05-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '5ee7f6aca042'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('full_name', sa.String(length=255), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('users', 'full_name')
