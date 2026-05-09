#!/bin/bash
set -e

echo "🔧 Setup: Hermes Agent + Web Terminal..."

# Ensure data directory exists and is owned
mkdir -p /opt/data
chown -R hermes:hermes /opt/data 2>/dev/null || true

# Download ttyd if not present
TTYD_BIN="/usr/local/bin/ttyd"
if [ ! -f "$TTYD_BIN" ]; then
    echo "📥 Downloading ttyd..."
    ARCH=$(uname -m)
    if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
        TTYD_URL="https://github.com/tsl0922/ttyd/releases/download/1.8.0/ttyd.linux.arm64"
    else
        TTYD_URL="https://github.com/tsl0922/ttyd/releases/download/1.8.0/ttyd.linux.amd64"
    fi
    wget -q -O "$TTYD_BIN" "$TTYD_URL" && chmod +x "$TTYD_BIN" || {
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

# Start web terminal on port 9200
echo "🌐 Web Terminal → http://<ip>:9200"
exec "$TTYD_BIN" -p 9200 -W -d -c "hermes@hermes-agent:~$ " bash
