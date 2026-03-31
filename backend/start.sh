#!/bin/sh
set -e

echo "Checking for Alembic revisions..."
REVISION_COUNT=$(alembic history 2>/dev/null | wc -l | tr -d ' ')
if [ "$REVISION_COUNT" -eq "0" ]; then
  echo "No revisions found — generating initial migration..."
  alembic revision --autogenerate -m "init"
fi

echo "Running database migrations..."
alembic upgrade head
echo "Migrations complete. Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
