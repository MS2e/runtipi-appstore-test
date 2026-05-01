"""TradingAgents Web API — FastAPI wrapper for TradingAgents CLI."""
import os
import sys
import asyncio
import json
import logging
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("tradingagents-web")

app = FastAPI(title="TradingAgents Web", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

WEB_DIR = Path("/app/web")
RESULTS_DIR = Path("/root/.tradingagents/logs")

class AnalyzeRequest(BaseModel):
    ticker: str = "AAPL"
    date: str = ""
    analysts: list[str] = ["market", "social", "news", "fundamentals"]

class AnalyzeResponse(BaseModel):
    success: bool
    ticker: str
    decision: Optional[str] = None
    output: Optional[str] = None
    error: Optional[str] = None

class StatusResponse(BaseModel):
    configured: bool
    provider: str
    model: str
    ticker: str

@app.get("/", response_class=HTMLResponse)
async def index():
    html = WEB_DIR / "index.html"
    if html.exists():
        return HTMLResponse(html.read_text())
    return HTMLResponse("<h1>TradingAgents</h1><p>Loading...</p>")

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/api/status", response_model=StatusResponse)
async def get_status():
    provider = os.getenv("TRADINGAGENTS_LLM_PROVIDER", "openai")
    api_key = os.getenv("TRADINGAGENTS_API_KEY", "")
    model = os.getenv("TRADINGAGENTS_DEFAULT_MODEL", "gpt-5.4")
    ticker = os.getenv("TRADINGAGENTS_INITIAL_TICKER", "AAPL")
    return StatusResponse(
        configured=bool(api_key and api_key != "***"),
        provider=provider,
        model=model,
        ticker=ticker,
    )

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    """Run TradingAgents analysis via Python API."""
    try:
        from tradingagents.graph.trading_graph import TradingAgentsGraph
        from tradingagents.default_config import DEFAULT_CONFIG
    except ImportError:
        return AnalyzeResponse(success=False, ticker=req.ticker, error="TradingAgents not installed yet. Please wait for initial setup.")

    config = DEFAULT_CONFIG.copy()
    provider = os.getenv("TRADINGAGENTS_LLM_PROVIDER", "openai")
    model = os.getenv("TRADINGAGENTS_DEFAULT_MODEL", "gpt-5.4")
    config["llm_provider"] = provider

    # Map provider to API key env var
    api_key_map = {
        "openai": "OPENAI_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
        "google": "GOOGLE_API_KEY",
        "deepseek": "DEEPSEEK_API_KEY",
        "xai": "XAI_API_KEY",
        "dashscope": "DASHSCOPE_API_KEY",
        "zhipu": "ZHIPU_API_KEY",
        "openrouter": "OPENROUTER_API_KEY",
    }
    key_env = api_key_map.get(provider, "OPENAI_API_KEY")
    api_key = os.getenv("TRADINGAGENTS_API_KEY", "") or os.getenv(key_env, "")
    if api_key and api_key != "***":
        os.environ[key_env] = api_key

    ta = TradingAgentsGraph(
        selected_analysts=req.analysts,
        debug=False,
        config=config,
    )

    try:
        # Run analysis (async subprocess to avoid blocking)
        loop = asyncio.get_event_loop()
        _, decision = await loop.run_in_executor(
            None, lambda: ta.propagate(req.ticker, req.date)
        )
        return AnalyzeResponse(
            success=True,
            ticker=req.ticker,
            decision=str(decision)[:10000] if decision else "Analysis completed",
        )
    except Exception as e:
        log.error(f"Analysis failed for {req.ticker}: {e}")
        return AnalyzeResponse(success=False, ticker=req.ticker, error=str(e))

# Mount static files
app.mount("/static", StaticFiles(directory=str(WEB_DIR)), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
