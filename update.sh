#!/bin/bash
# Accor Extension Updater
cd "$(dirname "$0")"

echo "=== Accor Extension Updater ==="
CURRENT_VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/[^0-9.]//g')
echo "Current version: $CURRENT_VERSION"

# Pull latest
OUTPUT=$(git pull 2>&1)
echo "$OUTPUT"

if echo "$OUTPUT" | grep -q "Already up to date"; then
  echo "✓ No updates available."
else
  NEW_VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/[^0-9.]//g')
  echo ""
  echo "Updated: v$CURRENT_VERSION → v$NEW_VERSION"
  echo ""
  echo "Changes:"
  git log --oneline HEAD@{1}..HEAD 2>/dev/null
  echo ""
  echo "→ Now refresh the extension: chrome://extensions → click ↻ on Accor"
fi
