#!/usr/bin/env bash
# deploy.sh — One-command deploy for Baby Ray Studio
# Workaround: exFAT USB sets executable bits on all files,
# which Firebase Spark plan rejects. We stage to /tmp first.

set -euo pipefail

SRC="/Volumes/NO NAME/public"
TMP="/tmp/studio-deploy-clean"
PROJECT="studio-2fb13"

echo "🧹 Cleaning staging area..."
rm -rf "$TMP"
mkdir -p "$TMP"

echo "📦 Staging files..."
# Core HTML
cp "$SRC/index.html"      "$TMP/index.html"
cp "$SRC/styles.css"      "$TMP/styles.css" 2>/dev/null || true
cp "$SRC/storytime.html"  "$TMP/storytime.html" 2>/dev/null || true

# Built apps
cp -r "$SRC/studio-build"    "$TMP/studio-build"
cp -r "$SRC/mainstage-build" "$TMP/mainstage-build"
cp -r "$SRC/videochat-build" "$TMP/videochat-build" 2>/dev/null || true
cp -r "$SRC/lobby"           "$TMP/lobby"           2>/dev/null || true

# Shared assets
cp -r "$SRC/assets"  "$TMP/assets"  2>/dev/null || true
cp -r "$SRC/gifts"   "$TMP/gifts"   2>/dev/null || true
cp -r "$SRC/rooms"   "$TMP/rooms"   2>/dev/null || true
cp "$SRC/config.js"  "$TMP/config.js" 2>/dev/null || true

# Write firebase.json in staging dir
cat > "$TMP/firebase.json" <<'EOF'
{
  "hosting": {
    "site": "studio-2fb13",
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
EOF

echo "🔒 Fixing permissions (exFAT workaround)..."
find "$TMP" -type f -exec chmod 644 {} \;
find "$TMP" -type d -exec chmod 755 {} \;

echo "🚀 Deploying to $PROJECT..."
cd "$TMP"
firebase deploy --only hosting --project "$PROJECT"

echo ""
echo "✅ Live at: https://${PROJECT}.web.app"
