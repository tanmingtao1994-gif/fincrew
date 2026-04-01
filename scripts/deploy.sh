#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Parse arguments
ENV="dev"
while [[ $# -gt 0 ]]; do
  case $1 in
    --env) ENV="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ "$ENV" == "prod" ]]; then
  TARGET_DIR="$HOME/.openclaw"
  echo "[FinCrew] Deploying to PRODUCTION (~/.openclaw)"
  read -p "This will update PRODUCTION config. Continue? [y/N] " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then echo "Aborted."; exit 0; fi
else
  TARGET_DIR="$HOME/.openclaw-dev"
  echo "[FinCrew] Deploying to DEVELOPMENT (~/.openclaw-dev)"
fi

# Deploy agents (keep workspace-* prefix, copy directly to TARGET_DIR)
AGENTS_SRC="$PROJECT_ROOT/packages/openclaw-agents"

for agent_dir in "$AGENTS_SRC"/workspace-*; do
  agent_name=$(basename "$agent_dir")
  mkdir -p "$TARGET_DIR/$agent_name"
  rsync -av --delete --exclude=".openclaw/sessions" --exclude=".git" "$agent_dir/" "$TARGET_DIR/$agent_name/"
  echo "  Agent deployed: $agent_name"
done

# Deploy skills
if [ -d "$AGENTS_SRC/skills" ]; then
  mkdir -p "$TARGET_DIR/skills"
  rsync -av --delete --exclude="_TEMPLATE" "$AGENTS_SRC/skills/" "$TARGET_DIR/skills/"
  echo "  Skills deployed"
fi

# Deploy templates
if [ -d "$AGENTS_SRC/templates" ]; then
  mkdir -p "$TARGET_DIR/templates"
  rsync -av --delete "$AGENTS_SRC/templates/" "$TARGET_DIR/templates/"
  echo "  Templates deployed"
fi

# Deploy config (first-time only)
CONFIG_SRC="$PROJECT_ROOT/config/openclaw.json"
CONFIG_DST="$TARGET_DIR/openclaw.json"
if [ -f "$CONFIG_SRC" ]; then
  if [ -f "$CONFIG_DST" ]; then
    echo "  openclaw.json exists, skipping (merge manually if needed)"
  else
    cp "$CONFIG_SRC" "$CONFIG_DST"
    echo "  openclaw.json deployed (fill in API keys!)"
  fi
fi

echo "Deployment complete! (env=$ENV)"
if [[ "$ENV" == "dev" ]]; then
  echo "Run: openclaw --dev agent --agent financial-manager --message 'your prompt'"
else
  echo "Run: openclaw agent --agent financial-manager --message 'your prompt'"
fi
