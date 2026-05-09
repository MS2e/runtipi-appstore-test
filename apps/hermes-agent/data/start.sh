#!/bin/bash
set -e

echo "🔧 Setup: Hermes Agent + Web Terminal..."

# Ensure data directory exists and is owned
mkdir -p /opt/data
chown -R hermes:hermes /opt/data 2>/dev/null || true

# ttyd binary location — use /opt/data (persistent, always writable)
TTYD_BIN="/opt/data/ttyd"

# Download ttyd if not present (cached across restarts via volume mount)
if [ ! -f "$TTYD_BIN" ]; then
    echo "📥 Downloading ttyd..."
    ARCH=$(uname -m)
    TTYD_URL="https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.${ARCH}"
    echo "   URL: $TTYD_URL"

    TMP_TTYD="/tmp/ttyd-$$"
    curl -fsSL -o "$TMP_TTYD" "$TTYD_URL" 2>&1 && chmod +x "$TMP_TTYD" && {
        mv "$TMP_TTYD" "$TTYD_BIN"
        echo "✅ ttyd installed at $TTYD_BIN"
    } || {
        echo "❌ ttyd download FAILED"
        echo "Starting Hermes Gateway only (no terminal)..."
        exec hermes gateway run
    }
else
    echo "✅ ttyd already installed"
fi

# Start Hermes gateway in background
echo "🚀 Starting Hermes Gateway..."
hermes gateway run &
HERMES_PID=$!
echo "   PID: $HERMES_PID"

# Wait for Hermes to initialize
sleep 3
if ! kill -0 $HERMES_PID 2>/dev/null; then
    echo "⚠️  Hermes exited early — ttyd will still work"
fi

# Start web terminal as MAIN interface on port 9119
# Using '--' separator to cleanly separate ttyd opts from command
echo "🌐 Web Terminal → http://<ip>:9119"
echo "   Binary: $TTYD_BIN"
exec "$TTYD_BIN" -W -p 9119 -- bash
