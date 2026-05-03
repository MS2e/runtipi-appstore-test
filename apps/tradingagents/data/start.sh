#!/bin/bash
set -e
echo "====================================="
echo "  TradingAgents Web v1.2.1"
echo "====================================="

# Inline all app files — no volume mounts needed for these
# This ensures updates always reach the running container

cat > /tmp/server.py << 'SERVEREOF'
"""TradingAgents Web API — FastAPI wrapper for TradingAgents CLI."""
import os
import sys
import asyncio
import json
import logging
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("ta")

app = FastAPI(title="TradingAgents Web")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

WEB_DIR = Path("/tmp/web")
WEB_DIR.mkdir(exist_ok=True)

class AnalyzeRequest(BaseModel):
    ticker: str = "AAPL"
    date: str = ""
    analysts: list[str] = ["market", "social", "news", "fundamentals"]

class AnalyzeResponse(BaseModel):
    success: bool
    ticker: str
    signal: Optional[str] = None
    decision: Optional[str] = None
    reports: Optional[dict] = None
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
    relevant = ["TRADINGAGENTS_LLM_PROVIDER", "TRADINGAGENTS_API_KEY",
                "TRADINGAGENTS_DEFAULT_MODEL", "TRADINGAGENTS_OUTPUT_LANGUAGE",
                "TRADINGAGENTS_INITIAL_TICKER",
                "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_API_KEY",
                "DEEPSEEK_API_KEY", "XAI_API_KEY", "OPENROUTER_API_KEY"]
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
    """Run TradingAgents analysis."""
    # Check if installed
    if not os.path.exists("/tmp/.tradingagents_installed"):
        return AnalyzeResponse(
            success=False, ticker=req.ticker,
            error="TradingAgents not installed yet. Please wait 2-5 minutes for initial setup.",
        )

    try:
        from tradingagents.graph.trading_graph import TradingAgentsGraph
        from tradingagents.config import TradingAgentsConfig, set_config
    except ImportError as e:
        return AnalyzeResponse(
            success=False, ticker=req.ticker,
            error=f"TradingAgents import failed: {e}. Check TradingAgents v0.3.1 API compatibility.",
        )

    provider = os.getenv("TRADINGAGENTS_LLM_PROVIDER", "openai")
    model = os.getenv("TRADINGAGENTS_DEFAULT_MODEL", "gpt-5.4")

    # Map our provider names to v0.3.1 LLMProvider values
    provider_map = {
        "openai": "openai", "anthropic": "anthropic",
        "google": "google_genai", "google_genai": "google_genai",
        "deepseek": "litellm", "xai": "xai",
        "qwen": "litellm", "glm": "litellm",
        "openrouter": "openrouter", "ollama": "ollama",
        "azure": "openai",  # Azure uses OpenAI client
    }
    v3_provider = provider_map.get(provider, provider)

    api_key_map = {
        "openai": "OPENAI_API_KEY", "anthropic": "ANTHROPIC_API_KEY",
        "google_genai": "GOOGLE_API_KEY", "xai": "XAI_API_KEY",
        "openrouter": "OPENROUTER_API_KEY",
        "litellm": "OPENAI_API_KEY",  # litellm needs a base key
        "ollama": None, "huggingface": "HUGGINGFACE_API_KEY",
    }
    api_key = os.getenv("TRADINGAGENTS_API_KEY", "")
    key_env = api_key_map.get(v3_provider) or api_key_map.get(provider)

    if key_env and api_key and api_key != "***":
        os.environ[key_env] = api_key
        # For litellm-based providers, also set LITELLM key
        if v3_provider == "litellm":
            os.environ["LITELLM_API_KEY"] = api_key
            # Set provider-specific base_url for litellm
            if provider == "deepseek":
                os.environ["LITELLM_BASE_URL"] = "https://api.deepseek.com"
            elif provider == "qwen":
                os.environ["LITELLM_BASE_URL"] = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
            elif provider == "glm":
                os.environ["LITELLM_BASE_URL"] = "https://api.z.ai/api/paas/v4/"
    elif v3_provider == "ollama":
        pass
    else:
        return AnalyzeResponse(
            success=False, ticker=req.ticker,
            error="No API key configured. Set TRADINGAGENTS_API_KEY in RunTipi app settings.",
        )

    # Build config using v0.3.1 Pydantic model
    lang = os.getenv("TRADINGAGENTS_OUTPUT_LANGUAGE", "en")
    if lang in ("German", "Deutsch", "German"):
        lang = "de"
    elif lang not in ("en", "de", "zh", "ja", "ko", "fr"):
        lang = "en"

    # Auto-select a fast model for quick_think (orchestration steps)
    # while keeping the configured model for deep_think (analysis quality).
    #
    # IMPORTANT: quick_think MUST NOT use mini variants of reasoning models
    # (gpt-5.4-mini, o3-mini) because they reject reasoning_effort on /v1/chat.
    # Map to fully-compatible non-reasoning fast models instead.
    quick_model_map = {
        # OpenAI reasoning models → fast non-reasoning (reasoning_effort compatible)
        "gpt-5.4": "gpt-4.1",
        "gpt-5.4-mini": "gpt-4.1-mini",
        "gpt-5": "gpt-4.1",
        "gpt-5-mini": "gpt-4.1-mini",
        "gpt-4.5": "gpt-4.1",
        "gpt-4.1": "gpt-4.1-mini",
        "gpt-4.1-mini": "gpt-4.1-mini",
        "o3": "gpt-4.1",
        "o3-mini": "gpt-4.1-mini",
        "o4": "gpt-4.1",
        "o4-mini": "gpt-4.1-mini",
        # Anthropic → cheaper model of same family (effort param ok for Sonnet)
        "claude-sonnet-4": "claude-sonnet-4-20250514",
        "claude-sonnet-4-20250514": "claude-sonnet-4-20250514",
        "claude-opus-4": "claude-sonnet-4-20250514",
        # Others keep the same (already fast enough or no alternative)
    }
    quick_model = quick_model_map.get(model, model)

    config = TradingAgentsConfig(
        llm_provider=v3_provider,
        deep_think_llm=model,
        quick_think_llm=quick_model,
        max_debate_rounds=0,
        max_risk_discuss_rounds=0,
        max_recur_limit=50,
        response_language=lang,
        results_dir=Path("/root/.tradingagents/logs"),
        reasoning_effort="low",  # Minimal reasoning — compatible with all models
    )

    # Extend HTTP timeouts for multi-step analysis
    # Cloudflare free tier: 100s per request, but our container sits behind
    # RunTipi's nginx which has its own proxy_read_timeout (600s default)
    os.environ.setdefault("OPENAI_TIMEOUT", "600")
    os.environ.setdefault("OPENAI_MAX_RETRIES", "3")
    os.environ.setdefault("ANTHROPIC_TIMEOUT", "600")

    # Analysten-Reduktion entfernt — mit 15 Min Timeout und quick_think_llm
    # läuft auch die Vollanalyse durch (deep_think bleibt das konfigurierte Modell)

    try:
        ta = TradingAgentsGraph(
            selected_analysts=req.analysts,
            debug=False,
            config=config,
        )
    except Exception as e:
        return AnalyzeResponse(success=False, ticker=req.ticker, error=f"Init failed: {e}")

    try:
        loop = asyncio.get_event_loop()
        # 15-minute timeout — gives slow models (DeepSeek, Ollama) breathing room
        final_state, signal = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: ta.propagate(req.ticker, req.date)),
            timeout=900
        )

        reports={}
        for key in ["market_report", "sentiment_report", "news_report", "fundamentals_report"]:
            if key in final_state and final_state[key]:
                reports[key] = str(final_state[key])[:8000]

        pm_decision = final_state.get("final_trade_decision", "")
        return AnalyzeResponse(
            success=True, ticker=req.ticker, signal=signal,
            decision=str(pm_decision)[:15000] if pm_decision else "Analysis completed",
            reports=reports if reports else None,
        )
    except asyncio.TimeoutError:
        log.error(f"Analysis timed out for {req.ticker} after 900s")
        return AnalyzeResponse(
            success=False, ticker=req.ticker,
            error="Analyse hat 15 Minuten überschritten. Versuche mit nur 'market'-Analysten oder einem schnelleren LLM.",
        )
    except Exception as e:
        err_str = str(e)
        # Catch SDK-level 5xx errors (provider or proxy failure)
        failed_code = next((c for c in ["502", "503", "504", "524"] if c in err_str), None)
        if failed_code:
            log.error(f"API returned {failed_code} for {req.ticker}: {err_str[:200]}")
            return AnalyzeResponse(
                success=False, ticker=req.ticker,
                error=f"API-Fehler ({failed_code}). Provider temporär nicht erreichbar — bitte später erneut versuchen.",
            )
        # Catch Pydantic validation failures (SDK returned malformed response)
        if "validation failed" in err_str.lower() or "Response validation" in err_str:
            log.error(f"SDK returned malformed response for {req.ticker}: {err_str[:200]}")
            return AnalyzeResponse(
                success=False, ticker=req.ticker,
                error="API hat eine fehlerhafte Antwort gesendet. Provider-Seite hat eventuell einen internen Fehler — bitte später erneut versuchen.",
            )
        # Catch connection reset / network errors
        if "connection" in err_str.lower() or "reset" in err_str.lower():
            log.error(f"Connection error for {req.ticker}: {err_str[:200]}")
            return AnalyzeResponse(
                success=False, ticker=req.ticker,
                error="Verbindung zum LLM-Provider ist abgebrochen. Prüfe Netzwerk oder Proxy-Konfiguration — bitte erneut versuchen.",
            )
        log.error(f"Analysis failed for {req.ticker}: {e}", exc_info=True)
        return AnalyzeResponse(success=False, ticker=req.ticker, error=f"Analysis failed: {err_str[:500]}")

app.mount("/static", StaticFiles(directory=str(WEB_DIR)), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
SERVEREOF

mkdir -p /tmp/web
cat > /tmp/web/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>TradingAgents</title>
<style>
:root{--bg:#0a0e17;--card:#111827;--border:#1e293b;--primary:#3b82f6;--accent:#10b981;--warn:#f59e0b;--danger:#ef4444;--text:#e2e8f0;--muted:#94a3b8}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
.container{max-width:1100px;margin:0 auto;padding:2rem 1.5rem}
h1{font-size:2rem;background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.5rem}
.badge{display:inline-block;background:var(--card);border:1px solid var(--border);border-radius:99px;padding:.3rem 1rem;font-size:.8rem;color:var(--muted);margin:.2rem}
.form-area{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:2rem;margin-bottom:2rem}
.form-row{display:flex;gap:1rem;flex-wrap:wrap;align-items:end;margin-bottom:1rem}
.form-group{flex:1;min-width:180px}
.form-group label{display:block;font-size:.85rem;color:var(--muted);margin-bottom:.35rem}
.form-group input{width:100%;padding:.6rem;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:.95rem;outline:none}
.form-group input:focus{border-color:var(--primary)}
.checkbox-group{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:.25rem}
.checkbox-group label{display:flex;align-items:center;gap:.4rem;font-size:.9rem;color:var(--text);cursor:pointer}
button#analyze{background:linear-gradient(135deg,var(--primary),var(--accent));color:#fff;border:none;border-radius:8px;padding:.65rem 2rem;font-size:1rem;font-weight:600;cursor:pointer}
button#analyze:disabled{opacity:.4;cursor:not-allowed}
.spinner{display:inline-block;width:16px;height:16px;border:2px solid var(--muted);border-top-color:var(--primary);border-radius:50%;animation:spin .6s linear infinite;margin-right:.5rem;vertical-align:middle}
@keyframes spin{to{transform:rotate(360deg)}}
.signal-badge{display:inline-block;padding:.5rem 1.5rem;border-radius:99px;font-size:1.5rem;font-weight:700;margin:.5rem 0}
.signal-buy{background:rgba(16,185,129,.2);color:#34d399;border:2px solid #34d399}
.signal-overweight{background:rgba(59,130,246,.2);color:#60a5fa;border:2px solid #60a5fa}
.signal-hold{background:rgba(245,158,11,.2);color:#fbbf24;border:2px solid #fbbf24}
.signal-underweight{background:rgba(249,115,22,.2);color:#fb923c;border:2px solid #fb923c}
.signal-sell{background:rgba(239,68,68,.2);color:#f87171;border:2px solid #f87171}
.status-msg{padding:1rem;border-radius:8px;font-size:.9rem}
.status-msg.info{background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.25);color:var(--primary)}
.status-msg.success{background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);color:var(--accent)}
.status-msg.error{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#ef4444}
.result-section{background:var(--card);border:1px solid var(--border);border-radius:12px;margin-bottom:1rem;overflow:hidden}
.result-header{padding:1rem 1.5rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border)}
.result-header h3{font-size:1rem;color:var(--text);margin:0}
.result-body{padding:0 1.5rem;max-height:0;overflow:hidden;transition:max-height .3s}
.result-body.open{max-height:600px;overflow-y:auto;padding:1rem 1.5rem}
.result-body pre{white-space:pre-wrap;word-break:break-word;font-size:.85rem;color:var(--muted);line-height:1.7}
#results{display:none}
.progress-bar{width:100%;height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin:1rem 0}
.progress-bar-fill{height:100%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:2px;animation:progress 60s linear;width:0%}
@keyframes progress{to{width:100%}}
</style>
</head>
<body>
<div class="container">
<h1>TradingAgents</h1>
<div><span class="badge" id="status-badge">Checking config...</span></div>
<section style="margin-top:2rem">
<div class="form-area">
<div class="form-row">
<div class="form-group"><label>Ticker</label><input type="text" id="ticker" value="AAPL"></div>
<div class="form-group"><label>Datum (leer=heute)</label><input type="date" id="date"></div>
<button id="analyze" onclick="runAnalysis()">Analysieren</button>
</div>
<div class="form-group" style="margin-bottom:1rem">
<label>Analysten</label>
<div class="checkbox-group">
<label><input type="checkbox" value="market" checked> Market</label>
<label><input type="checkbox" value="social" checked> Social</label>
<label><input type="checkbox" value="news" checked> News</label>
<label><input type="checkbox" value="fundamentals" checked> Fundamentals</label>
</div>
</div>
<div id="status"></div>
<div class="progress-bar" id="progress" style="display:none"><div class="progress-bar-fill"></div></div>
</div>
</section>
<section id="results">
<h2>Ergebnisse</h2>
<div id="signal-area" style="text-align:center;margin-bottom:1.5rem"></div>
<div id="reports-container"></div>
</section>
<footer style="text-align:center;padding:2rem 0;color:var(--muted);font-size:.8rem;border-top:1px solid var(--border)">
TradingAgents Research Tool — keine Finanzberatung
</footer>
</div>
<script>
const sigLabels={'Buy':'Kaufen','Overweight':'Übergewichten','Hold':'Halten','Underweight':'Untergewichten','Sell':'Verkaufen'};
const repLabels={'market_report':'Market Analyst','sentiment_report':'Sentiment Analyst','news_report':'News Analyst','fundamentals_report':'Fundamentals Analyst','final_trade_decision':'Portfolio Manager Entscheidung'};
async function runAnalysis(){
const btn=document.getElementById('analyze'),st=document.getElementById('status'),pr=document.getElementById('progress'),res=document.getElementById('results');
const ticker=document.getElementById('ticker').value.trim(),date=document.getElementById('date').value;
const analysts=[];
document.querySelectorAll('.checkbox-group input:checked').forEach(c=>analysts.push(c.value));
if(!ticker||analysts.length===0){showStatus('Bitte Ticker und Analysten w.','error');return}
btn.disabled=true;res.style.display='none';pr.style.display='block';
pr.querySelector('.progress-bar-fill').style.animation='none';void pr.querySelector('.progress-bar-fill').offsetWidth;
pr.querySelector('.progress-bar-fill').style.animation='progress 60s linear';
showStatus('Analysiere '+ticker+'... (2-5 Min)','info');
const t=Date.now();
try{const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticker,date,analysts})});
const d=await r.json();pr.style.display='none';
if(d.success){const e=((Date.now()-t)/1000).toFixed(0)+'s';showStatus('Done ('+e+')','success');displayResults(d)}
else showStatus('Fehler: '+d.error,'error')}
catch(e){pr.style.display='none';showStatus('Netzwerk: '+e.message,'error')}
btn.disabled=false}
function displayResults(d){
const res=document.getElementById('results'),sa=document.getElementById('signal-area'),co=document.getElementById('reports-container');co.innerHTML='';
if(d.signal){const cl='signal-'+d.signal.toLowerCase(),lb=sigLabels[d.signal]||d.signal;sa.innerHTML='<span class="signal-badge '+cl+'">'+lb+'</span>'}else sa.innerHTML='';
if(d.decision)co.innerHTML+=mk('final_trade_decision',d.decision,true);
if(d.reports)Object.entries(d.reports).forEach(([k,v])=>{if(v)co.innerHTML+=mk(k,v)});
res.style.display='block';res.scrollIntoView({behavior:'smooth'})}
function mk(k,c,s=false){const id='r'+k.replace(/[^a-zA-Z]/g,'');return'<div class="result-section"><div class="result-header'+(s?' open':'')+'" onclick="tog(\''+id+'\')"><h3>'+repLabels[k]||k+'</h3><span>▼</span></div><div class="result-body'+(s?' open':'')+'" id="'+id+'"><pre>'+esc(c)+'</pre></div></div>'}
function tog(i){const b=document.getElementById(i);b.classList.toggle('open');b.previousElementSibling.classList.toggle('open')}
function esc(t){const d=document.createElement('div');d.textContent=t;return d.innerHTML}
function showStatus(m,t){const e=document.getElementById('status');e.className='status-msg '+t;e.innerHTML=m;e.style.display='block'}
(async()=>{try{const r=await fetch('/api/status');const d=await r.json();
document.getElementById('ticker').value=d.ticker||'AAPL';
const b=document.getElementById('status-badge');b.innerHTML=d.configured?'✅ '+d.provider+'/'+d.model:'⚠️ Kein API Key'}catch(e){document.getElementById('status-badge').innerHTML='❌'}})();
</script>
</body>
</html>
HTMLEOF

echo "📦 Ensuring tradingagents is installed..."
set +e
pip3 install --no-cache-dir --break-system-packages tradingagents 2>&1 | tail -3
PIP_RC=$?
set -e
if [ $PIP_RC -ne 0 ]; then
    echo "⚠️ Retrying pip install without --break-system-packages..."
    pip3 install --no-cache-dir tradingagents 2>&1 | tail -3
    PIP_RC=$?
    set -e
fi
if [ $PIP_RC -ne 0 ]; then
    echo "❌ FATAL: pip install tradingagents failed (rc=$PIP_RC)"
    echo "   Container cannot start without tradingagents package."
    exit 1
fi

# Verify install
if ! python3 -c "from tradingagents.graph.trading_graph import TradingAgentsGraph" 2>/dev/null; then
    echo "❌ FATAL: tradingagents package installed but TradingAgentsGraph import failed"
    exit 1
fi

# Install web deps
pip3 install --no-cache-dir --break-system-packages uvicorn fastapi 2>&1 | tail -1 || true

# Mark as installed
touch /tmp/.tradingagents_installed
echo "✅ All dependencies ready"

echo "🚀 Starting server on :8080"
cd /tmp
exec python3 -m uvicorn server:app --host 0.0.0.0 --port 8080
