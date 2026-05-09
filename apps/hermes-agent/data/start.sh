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
        TTYD_URL="https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.aarch64"
    else
        TTYD_URL="https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64"
    fi
    echo "   URL: $TTYD_URL"
    echo "   Arch: $ARCH"

    # Download to /tmp first (always writable), then move to target
    TMP_TTYD="/tmp/ttyd-$$"
    curl -fsSL -o "$TMP_TTYD" "$TTYD_URL" 2>&1 && chmod +x "$TMP_TTYD" && {
        echo "   Downloaded ($(du -h "$TMP_TTYD" | cut -f1))"
        # Try to copy to /usr/local/bin (might need root)
        if cp "$TMP_TTYD" "$TTYD_BIN" 2>/dev/null || sudo cp "$TMP_TTYD" "$TTYD_BIN" 2>/dev/null; then
            chmod +x "$TTYD_BIN"
            echo "✅ ttyd installed at $TTYD_BIN"
        else
            # Fallback: use it from /tmp
            TTYD_BIN="$TMP_TTYD"
            echo "⚠️  Can't write to /usr/local/bin, using from /tmp"
        fi
        rm -f "$TMP_TTYD"
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
echo "🌐 Web Terminal → http://<ip>:9119"
echo "   Binary: $TTYD_BIN ($(du -h "$TTYD_BIN" 2>/dev/null | cut -f1))"
exec "$TTYD_BIN" -W -T -p 9119 -c "hermes@hermes-agent:~$ " bash
