#!/bin/bash
set -e

export PATH="/root/.hermes/bin:/usr/local/bin:/usr/bin:/bin"
export PYTHONDONTWRITEBYTECODE=1

mkdir -p /tmp/web /tmp/server

# Generate translations.js based on configured language
LANG="${TRADINGAGENTS_OUTPUT_LANGUAGE:-en}"
case "$LANG" in
    de|German|Deutsch) LANG="de" ;;
    fr|Français) LANG="fr" ;;
    es|Español) LANG="es" ;;
    *) LANG="en" ;;
esac

cat > /tmp/web/translations.js << TRBASEOF
const LANG = "${LANG}";
const T = {
  en: {
    ticker: "Ticker",
    date: "Date (leave blank for today)",
    analyze: "Analyze",
    analysts: "Analysts",
    cb_market: "Market",
    cb_social: "Social",
    cb_news: "News",
    cb_fundamentals: "Fundamentals",
    results: "Results",
    checking: "Checking config...",
    no_api: "No API Key",
    analyzing: "Analyzing",
    done: "Done",
    error: "Error",
    network: "Network",
    validate: "Please enter a ticker and select analysts",
    footer: "TradingAgents Research Tool — not financial advice",
    sig_buy: "Buy",
    sig_overweight: "Overweight",
    sig_hold: "Hold",
    sig_underweight: "Underweight",
    sig_sell: "Sell",
    rep_market: "Market Analyst",
    rep_sentiment: "Sentiment Analyst",
    rep_news: "News Analyst",
    rep_fundamentals: "Fundamentals Analyst",
    step_debate: "Investment Debate",
    step_investment: "Investment Plan",
    step_trader: "Trader Plan",
    step_risk: "Risk Debate",
    step_final: "Final Decision",
    bull: "Bull",
    bear: "Bear",
    aggressive: "Aggressive",
    conservative: "Conservative",
    neutral: "Neutral",
    research_mgr: "Research Manager",
    risk_mgr: "Risk Manager",
  },
  de: {
    ticker: "Ticker",
    date: "Datum (leer = heute)",
    analyze: "Analysieren",
    analysts: "Analysten",
    cb_market: "Markt",
    cb_social: "Social",
    cb_news: "Nachrichten",
    cb_fundamentals: "Fundamentals",
    results: "Ergebnisse",
    checking: "Konfiguration prüfen...",
    no_api: "Kein API Key",
    analyzing: "Analysiere",
    done: "Fertig",
    error: "Fehler",
    network: "Netzwerk",
    validate: "Bitte Ticker eingeben und Analysten wählen",
    footer: "TradingAgents Recherche-Tool — keine Finanzberatung",
    sig_buy: "Kaufen",
    sig_overweight: "Übergewichten",
    sig_hold: "Halten",
    sig_underweight: "Untergewichten",
    sig_sell: "Verkaufen",
    rep_market: "Markt-Analyst",
    rep_sentiment: "Sentiment-Analyst",
    rep_news: "News-Analyst",
    rep_fundamentals: "Fundamentals-Analyst",
    step_debate: "Investitions-Debatte",
    step_investment: "Investment-Plan",
    step_trader: "Trader-Plan",
    step_risk: "Risiko-Debatte",
    step_final: "Finale Entscheidung",
    bull: "Bull",
    bear: "Bear",
    aggressive: "Aggressiv",
    conservative: "Konservativ",
    neutral: "Neutral",
    research_mgr: "Research Manager",
    risk_mgr: "Risk Manager",
  },
  fr: {
    ticker: "Ticker",
    date: "Date (laisser vide pour aujourd'hui)",
    analyze: "Analyser",
    analysts: "Analystes",
    cb_market: "Marché",
    cb_social: "Social",
    cb_news: "Actualités",
    cb_fundamentals: "Fondamentaux",
    results: "Résultats",
    checking: "Vérification de la config...",
    no_api: "Aucune clé API",
    analyzing: "Analyse en cours",
    done: "Terminé",
    error: "Erreur",
    network: "Réseau",
    validate: "Veuillez entrer un ticker et sélectionner des analystes",
    footer: "Outil de recherche TradingAgents — pas un conseil financier",
    sig_buy: "Acheter",
    sig_overweight: "Surpondérer",
    sig_hold: "Maintenir",
    sig_underweight: "Sous-pondérer",
    sig_sell: "Vendre",
    rep_market: "Analyste Marché",
    rep_sentiment: "Analyste Sentiment",
    rep_news: "Analyste Actualités",
    rep_fundamentals: "Analyste Fondamentaux",
    step_debate: "Débat d'Investissement",
    step_investment: "Plan d'Investissement",
    step_trader: "Plan du Trader",
    step_risk: "Débat sur les Risques",
    step_final: "Décision Finale",
    bull: "Bull",
    bear: "Bear",
    aggressive: "Agressif",
    conservative: "Conservateur",
    neutral: "Neutre",
    research_mgr: "Chef Recherche",
    risk_mgr: "Chef Risques",
  },
  es: {
    ticker: "Ticker",
    date: "Fecha (dejar vacío para hoy)",
    analyze: "Analizar",
    analysts: "Analistas",
    cb_market: "Mercado",
    cb_social: "Social",
    cb_news: "Noticias",
    cb_fundamentals: "Fundamentos",
    results: "Resultados",
    checking: "Verificando configuración...",
    no_api: "Sin clave API",
    analyzing: "Analizando",
    done: "Listo",
    error: "Error",
    network: "Red",
    validate: "Por favor ingrese un ticker y seleccione analistas",
    footer: "Herramienta de investigación TradingAgents — no es asesoría financiera",
    sig_buy: "Comprar",
    sig_overweight: "Sopesar",
    sig_hold: "Mantener",
    sig_underweight: "Subpesar",
    sig_sell: "Vender",
    rep_market: "Analista de Mercado",
    rep_sentiment: "Analista de Sentimiento",
    rep_news: "Analista de Noticias",
    rep_fundamentals: "Analista de Fundamentos",
    step_debate: "Debate de Inversión",
    step_investment: "Plan de Inversión",
    step_trader: "Plan del Trader",
    step_risk: "Debate de Riesgo",
    step_final: "Decisión Final",
    bull: "Bull",
    bear: "Bear",
    aggressive: "Agresivo",
    conservative: "Conservador",
    neutral: "Neutral",
    research_mgr: "Jefe de Investigación",
    risk_mgr: "Jefe de Riesgos",
  },
};
const t = T[LANG] || T.en;
TRBASEOF

echo "🌐 Language set to: ${LANG}"

# Write Python server
cat > /tmp/server/server.py << 'SERVEREOF'
import os, sys, logging, asyncio, time
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("tradingagents-app")

app = FastAPI()
app.mount("/static", StaticFiles(directory="/tmp/web"), name="static")

lang = os.getenv("TRADINGAGENTS_OUTPUT_LANGUAGE", "en")
if lang in ("German", "Deutsch", "German"):
    lang = "de"
elif lang not in ("en", "de", "zh", "ja", "ko", "fr", "es"):
    lang = "en"

@app.get("/", response_class=HTMLResponse)
async def index():
    html_path = Path("/tmp/web/index.html")
    if html_path.exists():
        return html_path.read_text()
    return "<h1>Loading...</h1>"

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
    debate: Optional[dict] = None
    risk_debate: Optional[dict] = None
    investment_plan: Optional[str] = None
    trader_plan: Optional[str] = None
    error: Optional[str] = None

class StatusResponse(BaseModel):
    configured: bool
    provider: str = ""
    model: str = ""
    ticker: str = ""
    lang: str = ""

installed = Path("/tmp/.tradingagents_installed")

@app.get("/api/status")
async def status():
    api_key = os.getenv("TRADINGAGENTS_API_KEY") or os.getenv("TRADINGAGENTS_API_KEYS")
    if not api_key:
        return StatusResponse(configured=False)
    provider = os.getenv("TRADINGAGENTS_LLM_PROVIDER", "openai")
    model = os.getenv("TRADINGAGENTS_DEFAULT_MODEL", "gpt-5.4")
    ticker = os.getenv("TRADINGAGENTS_INITIAL_TICKER", "AAPL")
    return StatusResponse(configured=True, provider=provider, model=model, ticker=ticker, lang=lang)

@app.get("/translations.js")
async def translations():
    from fastapi.responses import FileResponse
    return FileResponse("/tmp/web/translations.js", media_type="application/javascript")

@app.post("/api/analyze")
async def analyze(req: AnalyzeRequest):
    if not installed.exists():
        return AnalyzeResponse(
            success=False, ticker=req.ticker,
            error="TradingAgents not installed yet. Please wait 2-5 minutes for initial setup.",
        )

    api_key = os.getenv("TRADINGAGENTS_API_KEY") or os.getenv("TRADINGAGENTS_API_KEYS")
    if not api_key:
        return AnalyzeResponse(
            success=False, ticker=req.ticker,
            error="No API key configured. Set TRADINGAGENTS_API_KEY in RunTipi app settings.",
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

    provider_map = {
        "openai": "openai", "anthropic": "anthropic",
        "google": "google_genai", "google_genai": "google_genai",
        "deepseek": "litellm", "xai": "xai",
        "qwen": "litellm", "glm": "litellm",
        "openrouter": "openrouter", "ollama": "ollama",
        "azure": "openai",
    }
    v3_provider = provider_map.get(provider, provider)

    api_key_map = {
        "openai": "OPENAI_API_KEY", "anthropic": "ANTHROPIC_API_KEY",
        "google_genai": "GOOGLE_API_KEY", "xai": "XAI_API_KEY",
        "openrouter": "OPENROUTER_API_KEY",
    }
    if v3_provider in api_key_map:
        os.environ[api_key_map[v3_provider]] = api_key
    elif v3_provider == "litellm":
        os.environ["LITELLM_API_KEY"] = api_key
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

    # Monkey-patch _create_llm to filter reasoning_effort for non-reasoning models
    try:
        from tradingagents.graph.trading_graph import TradingAgentsGraph
        from langchain_core.language_models.chat_models import BaseChatModel

        _orig_create_llm = TradingAgentsGraph._create_llm

        def _safe_create_llm(self, model_name: str):
            model_lower = model_name.lower()
            is_reasoning = any(k in model_lower for k in ("o3", "o4", "gpt-5.4", "gpt-4.5", "gpt-5.1"))
            if not is_reasoning:
                import inspect
                sig = inspect.signature(_orig_create_llm)
                if "reasoning_effort" in sig.parameters:
                    cls = self.__class__
                    old_init = cls.__init__
                    def patched_init(self_obj, **kw):
                        kw.pop("reasoning_effort", None)
                        old_init(self_obj, **kw)
                    cls.__init__ = patched_init
            return _orig_create_llm(self, model_name)

        TradingAgentsGraph._create_llm = _safe_create_llm
    except Exception as patch_err:
        log.warning(f"Monkey-patch for reasoning_effort failed: {patch_err}")

    quick_model_map = {
        "gpt-5.4": "gpt-4.1",
        "gpt-5": "gpt-4.1",
        "gpt-5.4-mini": "gpt-4.1-mini",
        "gpt-5.1": "gpt-4.1",
        "gpt-5-mini": "gpt-4.1-mini",
        "gpt-4.5": "gpt-4.1",
        "gpt-4.1": "gpt-4.1-mini",
        "gpt-4.1-mini": "gpt-4.1-mini",
        "o3": "gpt-4.1",
        "o3-mini": "gpt-4.1-mini",
        "o4": "gpt-4.1",
        "o4-mini": "gpt-4.1-mini",
        "claude-sonnet-4": "claude-sonnet-4-20250514",
        "claude-sonnet-4-20250514": "claude-sonnet-4-20250514",
        "claude-opus-4": "claude-sonnet-4-20250514",
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
        reasoning_effort="low",
    )

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
        final_state, signal = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: ta.propagate(req.ticker, req.date)),
            timeout=900
        )

        reports = {}
        for key in ["market_report", "sentiment_report", "news_report", "fundamentals_report"]:
            val = getattr(final_state, key, "")
            if val:
                reports[key] = str(val)[:8000]

        debate = getattr(final_state, "investment_debate_state", None)
        debate_data = None
        if debate:
            debate_data = {
                "bull_history": str(getattr(debate, "bull_history", ""))[:6000],
                "bear_history": str(getattr(debate, "bear_history", ""))[:6000],
                "judge_decision": str(getattr(debate, "judge_decision", ""))[:4000],
                "rounds": getattr(debate, "count", 0),
            }

        risk_debate = getattr(final_state, "risk_debate_state", None)
        risk_data = None
        if risk_debate:
            risk_data = {
                "aggressive_history": str(getattr(risk_debate, "aggressive_history", ""))[:6000],
                "conservative_history": str(getattr(risk_debate, "conservative_history", ""))[:6000],
                "neutral_history": str(getattr(risk_debate, "neutral_history", ""))[:6000],
                "judge_decision": str(getattr(risk_debate, "judge_decision", ""))[:4000],
                "rounds": getattr(risk_debate, "count", 0),
            }

        pm_decision = getattr(final_state, "final_trade_decision", "") or ""
        investment_plan = str(getattr(final_state, "investment_plan", ""))[:6000] or ""
        trader_plan = str(getattr(final_state, "trader_investment_plan", ""))[:6000] or ""

        return AnalyzeResponse(
            success=True, ticker=req.ticker, signal=signal,
            decision=str(pm_decision)[:15000] if pm_decision else "Analysis completed",
            reports=reports if reports else None,
            debate=debate_data,
            risk_debate=risk_data,
            investment_plan=investment_plan,
            trader_plan=trader_plan,
        )
    except asyncio.TimeoutError:
        log.error(f"Analysis timed out for {req.ticker} after 900s")
        return AnalyzeResponse(
            success=False, ticker=req.ticker,
            error="Analysis exceeded 15 minutes. Try with fewer analysts or a faster LLM.",
        )
    except Exception as e:
        err_str = str(e)
        failed_code = next((c for c in ["502", "503", "504", "524"] if c in err_str), None)
        if failed_code:
            log.error(f"API returned {failed_code} for {req.ticker}: {err_str[:200]}")
            return AnalyzeResponse(
                success=False, ticker=req.ticker,
                error=f"API error ({failed_code}). Provider temporarily unavailable — please try again later.",
            )
        pydantic_err = next((k for k in ["validation_error", "Field required", "extra_forbidden", "reasoning_effort"] if k.lower() in err_str.lower()), None)
        if pydantic_err:
            log.error(f"Pydantic validation error for {req.ticker}: {err_str[:300]}")
            return AnalyzeResponse(
                success=False, ticker=req.ticker,
                error="Model compatibility error. The selected model may not support all required parameters.",
            )
        log.error(f"Analysis failed for {req.ticker}: {err_str[:500]}")
        return AnalyzeResponse(
            success=False, ticker=req.ticker,
            error=f"Analysis failed: {err_str[:500]}",
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
SERVEREOF

# Write HTML (static — all dynamic strings come from translations.js)
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
.decision-flow{display:flex;flex-direction:column;gap:0.75rem;margin:1.5rem 0}
.decision-step{background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;cursor:pointer;transition:border-color .2s}
.decision-step:hover{border-color:var(--primary)}
.decision-step.open{border-color:var(--primary)}
.step-header{display:flex;align-items:center;gap:.75rem;padding:1rem 1.25rem;user-select:none}
.step-arrow-icon{flex-shrink:0;width:24px;text-align:center;color:var(--muted);transition:transform .2s;font-size:.9rem}
.decision-step.open .step-arrow-icon{transform:rotate(90deg)}
.step-title{flex:1;font-size:.85rem;font-weight:600;color:var(--text)}
.step-preview{flex:2;font-size:.8rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:50%}
.step-body{max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s;padding:0 1.25rem}
.decision-step.open .step-body{max-height:2000px;overflow-y:auto;padding:0 1.25rem 1rem}
.step-body-inner{font-size:.88rem;color:var(--text);line-height:1.7;white-space:pre-wrap;word-break:break-word}
.debate-grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.75rem}
.debate-side{background:var(--bg);border-radius:8px;padding:.75rem}
.debate-side h4{font-size:.78rem;margin-bottom:.3rem}
.bull-side h4{color:#34d399}.bear-side h4{color:#f87171}
.aggressive-side h4{color:#fbbf24}.conservative-side h4{color:#60a5fa}.neutral-side h4{color:#94a3b8}
.judge-box{background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.2);border-radius:8px;padding:.75rem}
.judge-box h4{color:var(--primary);font-size:.78rem;margin-bottom:.3rem}
#results{display:none}
.progress-bar{width:100%;height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin:1rem 0}
.progress-bar-fill{height:100%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:2px;animation:progress 60s linear;width:0%}
@keyframes progress{to{width:100%}}
</style>
</head>
<body>
<div class="container">
<h1>TradingAgents</h1>
<div><span class="badge" id="status-badge"></span></div>
<section style="margin-top:2rem">
<div class="form-area">
<div class="form-row">
<div class="form-group"><label id="lbl-ticker"></label><input type="text" id="ticker" value="AAPL"></div>
<div class="form-group"><label id="lbl-date"></label><input type="date" id="date"></div>
<button id="analyze" onclick="runAnalysis()"></button>
</div>
<div class="form-group" style="margin-bottom:1rem">
<label id="lbl-analysts"></label>
<div class="checkbox-group">
<label><input type="checkbox" value="market" checked><span id="cb-market"></span></label>
<label><input type="checkbox" value="social" checked><span id="cb-social"></span></label>
<label><input type="checkbox" value="news" checked><span id="cb-news"></span></label>
<label><input type="checkbox" value="fundamentals" checked><span id="cb-fundamentals"></span></label>
</div>
</div>
<div id="status"></div>
<div class="progress-bar" id="progress" style="display:none"><div class="progress-bar-fill"></div></div>
</div>
</section>
<section id="results">
<h2 id="lbl-results"></h2>
<div id="signal-area" style="text-align:center;margin-bottom:1.5rem"></div>
<div id="decision-flow" class="decision-flow" style="display:none"></div>
</section>
<footer style="text-align:center;padding:2rem 0;color:var(--muted);font-size:.8rem;border-top:1px solid var(--border)">
<span id="footer-text"></span>
</footer>
</div>
<script src="/translations.js"></script>
<script>
// Apply translations
document.getElementById('lbl-ticker').textContent = t.ticker;
document.getElementById('lbl-date').textContent = t.date;
document.getElementById('analyze').textContent = t.analyze;
document.getElementById('lbl-analysts').textContent = t.analysts;
document.getElementById('cb-market').textContent = t.cb_market;
document.getElementById('cb-social').textContent = t.cb_social;
document.getElementById('cb-news').textContent = t.cb_news;
document.getElementById('cb-fundamentals').textContent = t.cb_fundamentals;
document.getElementById('lbl-results').textContent = t.results;
document.getElementById('footer-text').textContent = t.footer;
document.documentElement.lang = LANG;

const sigLabels = {Buy:t.sig_buy,Overweight:t.sig_overweight,Hold:t.sig_hold,Underweight:t.sig_underweight,Sell:t.sig_sell};
const repLabels = {market_report:t.rep_market,sentiment_report:t.rep_sentiment,news_report:t.rep_news,fundamentals_report:t.rep_fundamentals};

async function runAnalysis(){
const btn=document.getElementById('analyze'),st=document.getElementById('status'),pr=document.getElementById('progress'),res=document.getElementById('results');
const ticker=document.getElementById('ticker').value.trim(),date=document.getElementById('date').value;
const analysts=[];
document.querySelectorAll('.checkbox-group input:checked').forEach(c=>analysts.push(c.value));
if(!ticker||analysts.length===0){showStatus(t.validate,'error');return}
btn.disabled=true;res.style.display='none';pr.style.display='block';
pr.querySelector('.progress-bar-fill').style.animation='none';void pr.querySelector('.progress-bar-fill').offsetWidth;
pr.querySelector('.progress-bar-fill').style.animation='progress 60s linear';
showStatus(t.analyzing+' '+ticker+'...','info');
const t_start=Date.now();
try{const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticker,date,analysts})});
const d=await r.json();pr.style.display='none';
if(d.success){const elapsed=((Date.now()-t_start)/1000).toFixed(0)+'s';showStatus(t.done+' ('+elapsed+')','success');displayResults(d)}
else showStatus(t.error+': '+d.error,'error')}
catch(e){pr.style.display='none';showStatus(t.network+': '+e.message,'error')}
btn.disabled=false}

function displayResults(d){
const res=document.getElementById('results'),sa=document.getElementById('signal-area'),df=document.getElementById('decision-flow');
if(d.signal){const cl='signal-'+d.signal.toLowerCase(),lb=sigLabels[d.signal]||d.signal;sa.innerHTML='<span class="'+cl+'">'+lb+'</span>'}else sa.innerHTML='';
df.innerHTML='';
let steps=[];let stepIdx=0;
if(d.reports){Object.entries(d.reports).forEach(([k,v])=>{
if(v){
let preview=v.substring(0,80).replace(/\n/g,' ');
steps.push({icon:'📊',title:repLabels[k]||k,preview:preview,bodyHtml:'<div class="step-body-inner">'+esc(v)+'</div>',id:'step'+stepIdx++});
}})}
if(d.debate&&d.debate.judge_decision){
let preview=d.debate.judge_decision.substring(0,60).replace(/\n/g,' ');
let debHtml='<div class="debate-grid"><div class="debate-side bull-side"><h4>'+t.bull+'</h4><div class="step-body-inner">'+esc(d.debate.bull_history||'—')+'</div></div><div class="debate-side bear-side"><h4>'+t.bear+'</h4><div class="step-body-inner">'+esc(d.debate.bear_history||'—')+'</div></div></div>';
debHtml+='<div class="judge-box"><h4>'+t.research_mgr+'</h4><div class="step-body-inner">'+esc(d.debate.judge_decision)+'</div></div>';
steps.push({icon:'⚔️',title:t.step_debate,preview:preview,bodyHtml:debHtml,id:'step'+stepIdx++});
}
if(d.investment_plan){
let preview=d.investment_plan.substring(0,60).replace(/\n/g,' ');
steps.push({icon:'📋',title:t.step_investment,preview:preview,bodyHtml:'<div class="step-body-inner">'+esc(d.investment_plan)+'</div>',id:'step'+stepIdx++});
}
if(d.trader_plan){
let preview=d.trader_plan.substring(0,60).replace(/\n/g,' ');
steps.push({icon:'💼',title:t.step_trader,preview:preview,bodyHtml:'<div class="step-body-inner">'+esc(d.trader_plan)+'</div>',id:'step'+stepIdx++});
}
if(d.risk_debate&&d.risk_debate.judge_decision){
let preview=d.risk_debate.judge_decision.substring(0,60).replace(/\n/g,' ');
let riskHtml='<div class="debate-grid"><div class="debate-side aggressive-side"><h4>'+t.aggressive+'</h4><div class="step-body-inner">'+esc(d.risk_debate.aggressive_history||'—')+'</div></div><div class="debate-side conservative-side"><h4>'+t.conservative+'</h4><div class="step-body-inner">'+esc(d.risk_debate.conservative_history||'—')+'</div></div><div class="debate-side neutral-side"><h4>'+t.neutral+'</h4><div class="step-body-inner">'+esc(d.risk_debate.neutral_history||'—')+'</div></div></div>';
riskHtml+='<div class="judge-box"><h4>'+t.risk_mgr+'</h4><div class="step-body-inner">'+esc(d.risk_debate.judge_decision)+'</div></div>';
steps.push({icon:'🛡️',title:t.step_risk,preview:preview,bodyHtml:riskHtml,id:'step'+stepIdx++});
}
if(d.decision&&d.decision!=='Analysis completed'){
let preview=d.decision.substring(0,60).replace(/\n/g,' ');
steps.push({icon:'✅',title:t.step_final,preview:preview,bodyHtml:'<div class="step-body-inner">'+esc(d.decision)+'</div>',id:'step'+stepIdx++,alwaysOpen:true});
}
if(steps.length>0){
steps.forEach((s)=>{
let openClass=s.alwaysOpen?' open':'';
df.innerHTML+='<div class="decision-step'+openClass+'" onclick="this.classList.toggle(\'open\')"><div class="step-header"><span class="step-arrow-icon">▶</span><span class="step-title">'+s.icon+' '+s.title+'</span><span class="step-preview">'+esc(s.preview)+'</span></div><div class="step-body" id="'+s.id+'">'+s.bodyHtml+'</div></div>';
});
df.style.display='flex';
}else{df.style.display='none'}
res.style.display='block';res.scrollIntoView({behavior:'smooth'})}

function esc(x){const d=document.createElement('div');d.textContent=x;return d.innerHTML}
function showStatus(m,ty){const e=document.getElementById('status');e.className='status-msg '+ty;e.innerHTML=m;e.style.display='block'}

(async()=>{try{const r=await fetch('/api/status');const d=await r.json();
document.getElementById('ticker').value=d.ticker||'AAPL';
const b=document.getElementById('status-badge');b.innerHTML=d.configured?'✅ '+d.provider+'/'+d.model:'⚠️ '+t.no_api}catch(e){document.getElementById('status-badge').innerHTML='❌'}})();
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
cd /tmp/server
exec python3 -m uvicorn server:app --host 0.0.0.0 --port 8080
