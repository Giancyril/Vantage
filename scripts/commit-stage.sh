#!/usr/bin/env bash
# Usage: ./scripts/commit-stage.sh "feat: description"
set -e
git add -A
git commit -m "$1" || echo "Nothing to commit"
