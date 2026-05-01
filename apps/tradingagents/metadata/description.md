# TradingAgents

[![GitHub Stars](https://img.shields.io/github/stars/TauricResearch/TradingAgents?style=social)](https://github.com/TauricResearch/TradingAgents)
[![arXiv](https://img.shields.io/badge/arXiv-2412.20138-B31B1B)](https://arxiv.org/abs/2412.20138)

## 🤖 Multi-Agent LLM Trading Framework

TradingAgents ist ein Multi-Agenten LLM-Framework, das die Dynamik realer Trading-Firmen nachbildet. Spezialisierte KI-Agenten — vom Fundamental-Analysten über Sentiment-Experten bis zum Portfolio Manager — evaluieren gemeinsam Marktbedingungen und treffen Trading-Entscheidungen durch strukturierte Diskussionen.

## Architektur

Das Framework zerlegt komplexe Trading-Aufgaben in spezialisierte Rollen:

### 📊 Analyst Team
- **Fundamentals Analyst**: Bewertet Unternehmensfinanzen und Performance-Metriken
- **Sentiment Analyst**: Analysiert Social Media und öffentliche Stimmung
- **News Analyst**: Überwacht globale Nachrichten und makroökonomische Indikatoren
- **Technical Analyst**: Nutzt technische Indikatoren (MACD, RSI) für Mustererkennung

### 🔬 Researcher Team
- Bullish und Bearish Researchers debattieren strukturiert die Analyst-Ergebnisse

### 💼 Trader Agent
- Zusammensetzen der Reports zu fundierten Trading-Entscheidungen

### 🛡️ Risk Management & Portfolio Manager
- Kontinuierliche Risikobewertung und Portfolio-Optimierung

## Supported LLM Providers
- OpenAI (GPT-5.4, GPT-5.4-mini)
- Anthropic (Claude)
- Google (Gemini)
- DeepSeek
- xAI (Grok)
- Qwen (DashScope)
- GLM (Zhipu)
- OpenRouter
- Ollama (lokale Modelle)

## RunTippi App
Diese App wrappert TradingAgents in einen Docker-Container mit einer Web-Oberfläche für einfache Nutzung.

⚠️ **Hinweis**: TradingAgents ist ein Forschungsprojekt — keine Finanzberatung.
