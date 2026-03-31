#!/usr/bin/env bash
#
# eval.sh — Unified eval entry point
#
# Usage:
#   bash scripts/eval.sh [subcommand] [--dir <path>]
#
# Subcommands:
#   (none)    Run all phases (run + compare) sequentially
#   run       Execute eval cases only
#   compare   Compare/judge results only
#
# Examples:
#   npm run eval                                                      # full pipeline, all cases
#   npm run eval --target single_agent/info_processor.json            # full pipeline, specific file (relative to dataset_dir)
#   npm run eval:run --dir single_agent                            # run only, specific dir (relative to dataset_dir)
#   npm run eval:compare                                              # compare only, latest batch
#

set -euo pipefail
cd "$(dirname "$0")/.."

# ---- Parse arguments ----
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
      # Bare positional arg (not a subcommand) → map to --target
      EXTRA_ARGS="$EXTRA_ARGS --target $arg"
      ;;
  esac
done

# Generate a shared timestamp for the batch
  TS=$(date +"%Y-%m-%d-%H-%M-%S")

# Build the final command
CMD="npx tsx scripts/eval.ts"
[ -n "$SUBCMD" ]     && CMD="$CMD $SUBCMD"
CMD="$CMD --timestamp $TS"
[ -n "$EXTRA_ARGS" ] && CMD="$CMD $EXTRA_ARGS"

echo "[eval] Command : $CMD"
echo ""

exec $CMD
