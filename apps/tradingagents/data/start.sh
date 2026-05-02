#!/bin/bash
set -e
echo "====================================="
echo "  TradingAgents Web - Starting up"
echo "====================================="

echo "🔍 Environment check:"
echo "  TRADINGAGENTS_LLM_PROVIDER=${TRADINGAGENTS_LLM_PROVIDER:-(not set)}"
echo "  TRADINGAGENTS_API_KEY=${TRADINGAGENTS_API_KEY:+(set, length: ${#TRADINGAGENTS_API_KEY})}"
echo "  TRADINGAGENTS_DEFAULT_MODEL=${TRADINGAGENTS_DEFAULT_MODEL:-(not set)}"
echo "  TRADINGAGENTS_OUTPUT_LANGUAGE=${TRADINGAGENTS_OUTPUT_LANGUAGE:-(not set)}"
echo "  TRADINGAGENTS_INITIAL_TICKER=${TRADINGAGENTS_INITIAL_TICKER:-(not set)}"

# Always ensure tradingagents is installed (container may be recreated)
echo ""
echo "📦 Ensuring tradingagents is installed..."
if python3 -c "import tradingagents; print('tradingagents' + tradingagents.__version__ if hasattr(tradingagents, '__version__') else '')" 2>/dev/null; then
    echo "✅ tradingagents already available"
else
    echo "🔨 Installing tradingagents (this may take 2-5 minutes on fresh container)..."
    set +e  # Don't exit on pip failure
    pip3 install --no-cache-dir --break-system-packages tradingagents 2>&1 | tail -5
    PIP_EXIT=$?
    set -e
    if [ $PIP_EXIT -ne 0 ]; then
        echo "⚠️ pip with --break-system-packages failed, trying alternative..."
        pip3 install --no-cache-dir tradingagents 2>&1 | tail -5
        PIP_EXIT=$?
        set -e
    fi
    if [ $PIP_EXIT -ne 0 ]; then
        echo "❌ FATAL: Failed to install tradingagents (exit code: $PIP_EXIT)"
        echo "   Container will keep restarting. Check logs for details."
        exit 1
    fi
    echo "✅ tradingagents installed successfully"
fi

echo ""
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
