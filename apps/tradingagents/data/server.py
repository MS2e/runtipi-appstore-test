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
    signal: Optional[str] = None          # Buy / Overweight / Hold / Underweight / Sell
    decision: Optional[str] = None        # Full PM markdown decision
    reports: Optional[dict] = None        # Individual analyst reports
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

@app.get("/api/env")
async def env_debug():
    """Debug endpoint — shows which env vars are set (keys only, values redacted)."""
    relevant = ["TRADINGAGENTS_LLM_PROVIDER", "TRADINGAGENTS_API_KEY",
                "TRADINGAGENTS_DEFAULT_MODEL", "TRADINGAGENTS_OUTPUT_LANGUAGE",
                "TRADINGAGENTS_INITIAL_TICKER",
                "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_API_KEY",
                "DEEPSEEK_API_KEY", "XAI_API_KEY", "OPENROUTER_API_KEY",
                "DASHSCOPE_API_KEY", "ZHIPU_API_KEY", "AZURE_OPENAI_API_KEY"]
    result = {}
    for k in relevant:
        v = os.getenv(k, "")
        if v:
            result[k] = "***" if len(v) > 4 else v
    return {"env_vars": result}

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
        return AnalyzeResponse(
            success=False,
            ticker=req.ticker,
            error="TradingAgents not installed yet. Please wait for initial setup.",
        )

    # Build config with ALL required keys
    config = DEFAULT_CONFIG.copy()
    provider = os.getenv("TRADINGAGENTS_LLM_PROVIDER", "openai")
    model = os.getenv("TRADINGAGENTS_DEFAULT_MODEL", "gpt-5.4")

    config["llm_provider"] = provider
    config["deep_think_llm"] = model           # deep reasoning agents
    config["quick_think_llm"] = model           # quick reasoning agents
    config["output_language"] = os.getenv("TRADINGAGENTS_OUTPUT_LANGUAGE", "English")

    # Map our single API key to the provider-specific env var
    api_key_map = {
        "openai": "OPENAI_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
        "google": "GOOGLE_API_KEY",
        "deepseek": "DEEPSEEK_API_KEY",
        "xai": "XAI_API_KEY",
        "dashscope": "DASHSCOPE_API_KEY",
        "qwen": "DASHSCOPE_API_KEY",
        "glm": "ZHIPU_API_KEY",
        "zhipu": "ZHIPU_API_KEY",
        "openrouter": "OPENROUTER_API_KEY",
        "ollama": None,  # ollama uses hardcoded "ollama" as key
        "azure": "AZURE_OPENAI_API_KEY",
    }
    api_key = os.getenv("TRADINGAGENTS_API_KEY", "")
    key_env = api_key_map.get(provider)

    if key_env and api_key and api_key != "***":
        os.environ[key_env] = api_key
        log.info(f"Set {key_env} from TRADINGAGENTS_API_KEY")
    elif provider == "ollama":
        log.info("Ollama provider — no API key needed")
    elif not api_key or api_key == "***":
        return AnalyzeResponse(
            success=False,
            ticker=req.ticker,
            error=f"No API key configured. Please set TRADINGAGENTS_API_KEY in RunTipi app settings.",
        )

    # Initialize TradingAgentsGraph
    try:
        ta = TradingAgentsGraph(
            selected_analysts=req.analysts,
            debug=False,
            config=config,
        )
    except Exception as e:
        log.error(f"Failed to initialize TradingAgentsGraph: {e}")
        return AnalyzeResponse(
            success=False,
            ticker=req.ticker,
            error=f"Failed to initialize TradingAgentsGraph: {e}",
        )

    # Run analysis — propagate returns (final_state_dict, signal_string)
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: ta.propagate(req.ticker, req.date),
        )

        final_state, signal = result

        # Extract individual analyst reports from final_state
        reports = {}
        for key in ["market_report", "sentiment_report", "news_report", "fundamentals_report"]:
            if key in final_state and final_state[key]:
                reports[key] = str(final_state[key])[:8000]

        # Extract the full portfolio manager decision
        pm_decision = final_state.get("final_trade_decision", "")

        return AnalyzeResponse(
            success=True,
            ticker=req.ticker,
            signal=signal,
            decision=str(pm_decision)[:15000] if pm_decision else "Analysis completed",
            reports=reports if reports else None,
        )
    except Exception as e:
        log.error(f"Analysis failed for {req.ticker}: {e}", exc_info=True)
        return AnalyzeResponse(
            success=False,
            ticker=req.ticker,
            error=str(e),
        )

# Mount static files
app.mount("/static", StaticFiles(directory=str(WEB_DIR)), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
