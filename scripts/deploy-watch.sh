#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "[FinCrew] Watch mode - syncing agent changes in real-time"
echo "  Source: packages/openclaw-agents"
echo "  Target: ~/.openclaw-dev/"
echo "  Press Ctrl+C to stop"
echo ""

# Initial deploy
bash "$SCRIPT_DIR/deploy.sh" --env dev

# Watch mode: cpx2 preserves relative path after the glob base
cd "$PROJECT_ROOT"

npx cpx2 "packages/openclaw-agents/**/*" ~/.openclaw-dev --watch --verbose --ignore="**/templates/**,**/.openclaw/sessions/**"
