#!/usr/bin/env bash
# Ensure Docker Compose can interpolate ${VAR} from .env.production.
#
# `env_file:` only injects variables into the *running container*. Compose
# resolves ${VAR} in the compose file itself (the NEXT_PUBLIC_* build args)
# from the shell environment or from `.env` in the project directory. Without
# this link those build args bake in as empty strings, and the browser-side
# Supabase client silently has no URL or key.
set -euo pipefail

cd "$(dirname "$0")/.."

[ -f .env.production ] || { echo "ERROR: .env.production is missing. Copy it from .env.production.example first."; exit 1; }

if [ -L .env ] || [ ! -e .env ]; then
  ln -sf .env.production .env
  echo "linked .env -> .env.production"
else
  echo "WARNING: .env exists as a real file, not a link."
  echo "Compose reads it for \${VAR} interpolation - make sure it carries the"
  echo "same NEXT_PUBLIC_* values as .env.production, or replace it with:"
  echo "    ln -sf .env.production .env"
fi
