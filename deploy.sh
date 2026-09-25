#!/usr/bin/env bash
set -eu

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="$REPO_DIR/logs"
LOG_FILE="$LOGS_DIR/deploy_$(date +%Y%m%d_%H%M%S).log"
MAINTENANCE_DIR="/var/www/maintenance"
MAINTENANCE_FLAG="$MAINTENANCE_DIR/enabled"

mkdir -p "$LOGS_DIR"

# Tee all output to timestamped log file while still printing to terminal
exec > >(tee "$LOG_FILE") 2>&1

echo ""
echo "========================================"
echo "==> Deploy started: $(date)"
echo "========================================"

# Handle maintenance mode
if [ "${MAINTENANCE_MODE:-false}" = "true" ]; then
  echo "==> Enabling maintenance mode..."
  mkdir -p "$MAINTENANCE_DIR"
  cp "$REPO_DIR/vps/maintenance.html" "$MAINTENANCE_DIR/index.html"
  touch "$MAINTENANCE_FLAG"
  if command -v nginx >/dev/null 2>&1; then
    nginx -t && systemctl reload nginx
  fi
  echo "==> Maintenance mode enabled. Skipping build."
  echo "========================================"
  echo "==> Deploy finished: $(date)"
  echo "========================================"
  echo "Log saved to: $LOG_FILE"
  exit 0
fi

# Disable maintenance mode if it was previously enabled
if [ -f "$MAINTENANCE_FLAG" ]; then
  echo "==> Disabling maintenance mode..."
  rm -f "$MAINTENANCE_FLAG"
  if command -v nginx >/dev/null 2>&1; then
    nginx -t && systemctl reload nginx
  fi
fi

echo "==> Installing dependencies..."
cd "$REPO_DIR"
npm ci

echo "==> Building the-wallet..."
npm run build

echo "==> Moving build output to release folder..."
rm -rf "$REPO_DIR/release"
mv dist "$REPO_DIR/release"

if command -v nginx >/dev/null 2>&1; then
  echo "==> Reloading nginx..."
  nginx -t && systemctl reload nginx
else
  echo "==> nginx not found, skipping reload (local test run?)."
fi

echo "==> Done."
echo "========================================"
echo "==> Deploy finished: $(date)"
echo "========================================"
echo "Log saved to: $LOG_FILE"
