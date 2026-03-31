#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "[FinCrew] Watch mode - syncing agent changes in real-time"
echo "  Source: packages/openclaw-agents"
echo "  Target: ~/.openclaw/agents & ~/.openclaw-dev/agents"
echo "  Press Ctrl+C to stop"
echo ""

# Initial deploy
bash "$SCRIPT_DIR/deploy.sh" --env dev

# cpx2 requires a glob STRING (not shell-expanded paths)
# Must cd to project root so the relative glob works correctly
cd "$PROJECT_ROOT"

npx cpx2 "packages/openclaw-agents/**/*" ~/.openclaw-dev --watch --verbose --ignore="**/templates/**,**/.openclaw/sessions/**"
