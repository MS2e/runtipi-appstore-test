#!/bin/bash
set -e

echo "🔧 Setup: Hermes Agent + Web Terminal..."

# Ensure data directory exists and is owned
mkdir -p /opt/data
chown -R hermes:hermes /opt/data 2>/dev/null || true

# Download ttyd if not present (use curl — available in base image)
TTYD_BIN="/usr/local/bin/ttyd"
if [ ! -f "$TTYD_BIN" ]; then
    echo "📥 Downloading ttyd..."
    ARCH=$(uname -m)
    if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
        TTYD_URL="https://github.com/tsl0922/ttyd/releases/download/1.8.0/ttyd.linux.arm64"
    else
        TTYD_URL="https://github.com/tsl0922/ttyd/releases/download/1.8.0/ttyd.linux.amd64"
    fi
    curl -sL -o "$TTYD_BIN" "$TTYD_URL" && chmod +x "$TTYD_BIN" || {
        echo "⚠️  ttyd download failed — starting Hermes only"
        exec hermes gateway run
    }
    echo "✅ ttyd ready at $TTYD_BIN"
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
# -W: enable websocket protocol (required for Runtipi proxy)
# -T: no authentication (open terminal)
# -p: port 9119 (Runtipi nginx proxy)
# -c: custom prompt string
echo "🌐 Web Terminal → http://<ip>:9119"
exec "$TTYD_BIN" -W -T -p 9119 -c "hermes@hermes-agent:~$ " bash
