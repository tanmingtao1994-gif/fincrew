#!/usr/bin/env bash
#
# eval.sh — Unified eval entry point
#
# Usage:
#   bash scripts/eval.sh [lang] [subcommand] [--dir <path>]
#
# Lang:
#   zh        Use Chinese eval cases (default)
#   en        Use English eval cases
#
# Subcommands:
#   (none)    Run all phases (run + compare) sequentially
#   run       Execute eval cases only
#   compare   Compare/judge results only
#
# Examples:
#   npm run eval                                                      # full pipeline, Chinese cases
#   npm run eval:zh                                                   # full pipeline, Chinese cases
#   npm run eval:en                                                   # full pipeline, English cases
#   npm run eval:run --dir single_agent                               # run only, specific dir
#

set -euo pipefail
cd "$(dirname "$0")/.."

# ---- Parse arguments ----
LANG="zh"
SUBCMD=""
EXTRA_ARGS=""
SKIP_NEXT=false

for arg in "$@"; do
  if $SKIP_NEXT; then
    EXTRA_ARGS="$EXTRA_ARGS $arg"
    SKIP_NEXT=false
    continue
  fi
  case "$arg" in
    zh|en)
      LANG="$arg"
      ;;
    run|compare)
      if [ -z "$SUBCMD" ]; then
        SUBCMD="$arg"
      else
        EXTRA_ARGS="$EXTRA_ARGS $arg"
      fi
      ;;
    --timestamp|--dir|--target)
      EXTRA_ARGS="$EXTRA_ARGS $arg"
      SKIP_NEXT=true
      ;;
    --*)
      EXTRA_ARGS="$EXTRA_ARGS $arg"
      ;;
    *)
      # Bare positional arg → map to --target
      EXTRA_ARGS="$EXTRA_ARGS --target $arg"
      ;;
  esac
done

# Generate a shared timestamp for the batch
TS=$(date +"%Y-%m-%d-%H-%M-%S")

# Build the final command with language-specific dataset path
CMD="npx tsx scripts/eval.ts"
[ -n "$SUBCMD" ]     && CMD="$CMD $SUBCMD"
CMD="$CMD --timestamp $TS --lang $LANG"
[ -n "$EXTRA_ARGS" ] && CMD="$CMD $EXTRA_ARGS"

echo "[eval] Language: $LANG"
echo "[eval] Command : $CMD"
echo ""

exec $CMD
