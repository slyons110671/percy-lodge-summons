#!/bin/bash
set -e

# Ensure data directories exist (important when a Railway volume is mounted)
mkdir -p data/meetings

# Copy default data files to the volume if they don't already exist
for file in data-defaults/*.json; do
  basename=$(basename "$file")
  target="data/$basename"
  if [ ! -f "$target" ]; then
    echo "Initialising $target from defaults..."
    cp "$file" "$target"
  fi
done

# Find system Chromium for Puppeteer (Railway Linux environment)
if [ -z "$PUPPETEER_EXECUTABLE_PATH" ]; then
  CHROMIUM=$(which chromium || which chromium-browser || echo "")
  if [ -n "$CHROMIUM" ]; then
    export PUPPETEER_EXECUTABLE_PATH="$CHROMIUM"
    echo "Using Chromium at: $CHROMIUM"
  fi
fi

exec node server.js
