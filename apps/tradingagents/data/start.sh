#!/bin/bash
set -e
echo "====================================="
echo "  TradingAgents Web - Starting up"
echo "====================================="

# Install dependencies on first run
if ! python3 -c "import tradingagents" 2>/dev/null; then
    echo "📦 Installing tradingagents (this may take a few minutes)..."
    pip install --no-cache-dir tradingagents 2>&1 | tail -3
    echo "✅ tradingagents installed"
else
    echo "✅ tradingagents already installed"
fi

if ! python3 -c "import uvicorn" 2>/dev/null; then
    pip install --no-cache-dir uvicorn 2>&1 | tail -1
fi

echo "🚀 Starting TradingAgents Web Server on :8080"
cd /app
exec python3 -m uvicorn server:app --host 0.0.0.0 --port 8080
