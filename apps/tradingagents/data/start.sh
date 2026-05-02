#!/bin/bash
set -e
echo "====================================="
echo "  TradingAgents Web - Starting up"
echo "====================================="

echo "🔍 Environment check:"
echo "  TRADINGAGENTS_LLM_PROVIDER=${TRADINGAGENTS_LLM_PROVIDER:-(not set)}"
echo "  TRADINGAGENTS_API_KEY=${TRADINGAGENTS_API_KEY:+(set)}"
echo "  TRADINGAGENTS_DEFAULT_MODEL=${TRADINGAGENTS_DEFAULT_MODEL:-(not set)}"
echo "  TRADINGAGENTS_OUTPUT_LANGUAGE=${TRADINGAGENTS_OUTPUT_LANGUAGE:-(not set)}"
echo "  TRADINGAGENTS_INITIAL_TICKER=${TRADINGAGENTS_INITIAL_TICKER:-(not set)}"

# Install dependencies on first run
if ! python3 -c "import tradingagents" 2>/dev/null; then
    echo "📦 Installing tradingagents (this may take a few minutes)..."
    # Python 3.12+ requires --break-system-packages for system pip
    PIP_ARGS="--no-cache-dir"
    if python3 -c "import sys; print(sys.version_info[:2])" 2>/dev/null | grep -q "3.1[2-9]\|3.[2-9]"; then
        PIP_ARGS="$PIP_ARGS --break-system-packages"
    fi
    pip3 install $PIP_ARGS tradingagents 2>&1 | tail -5
    echo "✅ tradingagents installed"
else
    echo "✅ tradingagents already installed"
fi

if ! python3 -c "import uvicorn" 2>/dev/null; then
    echo "📦 Installing uvicorn..."
    pip3 install --no-cache-dir --break-system-packages uvicorn 2>&1 | tail -1
fi

if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "📦 Installing fastapi..."
    pip3 install --no-cache-dir --break-system-packages fastapi 2>&1 | tail -1
fi

echo ""
echo "🚀 Starting TradingAgents Web Server on :8080"
cd /app
exec python3 -m uvicorn server:app --host 0.0.0.0 --port 8080
