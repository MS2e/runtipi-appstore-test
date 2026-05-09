# Hermes Agent

**CLI-first AI agent — Web Terminal + Docker container with persistent memory, multi-platform gateway, and self-improving skills**

Hermes is an open-source AI agent framework. The main interface is a **Web Terminal** in your browser — a full Bash shell inside the container. Optionally enable the **Dashboard UI** for chat-based interaction.

## Key Features

### 🤖 Autonomous Task Execution
- Give Hermes tasks in natural language via CLI or messaging platforms
- Plans and executes complex multi-step workflows autonomously
- Persistent memory survives across sessions

### 🌐 Multi-Platform Gateway
- **Telegram**: Full bot integration with conversation threads
- **Discord**: Slash commands and DM support
- **WhatsApp**: Bridge via WhatsApp Business API
- **Slack, Signal, QQ Bot** and more
- Each platform maintains separate conversation context

### 🧠 Persistent Memory System
- **Long-term memory**: SQLite database with FTS5 full-text search
- **Session history**: Complete conversation logs, searchable
- **Skills system**: Reusable workflows for common tasks
- **Cross-session context**: Remembers important facts and preferences

### 🛠️ Powerful Tool Suite
- **Browser Automation**: Playwright-based web interaction
- **File Operations**: Read, write, search, patch files safely
- **Terminal Commands**: Shell execution with approval system
- **Web Search**: Private search via SearXNG, Firecrawl, Tavily
- **Code Execution**: Sandboxed Python with tool access
- **Subagent Delegation**: Spawn parallel workers for complex tasks

### 🔒 Privacy-First Options
- **Cloud APIs**: OpenRouter (60+ models), direct provider APIs
- **Local Models**: LM Studio, llama.cpp, Ollama integration
- **Self-hosted search**: SearXNG backend option
- No data leaves your infrastructure when using local options

### 📚 Skills System
- Community-contributed reusable workflows
- Categories: GitHub, DevOps, ML/MLOps, Creative, Productivity, etc.
- Self-improving: Agent can create new skills from experience
- Platform-aware: Skills adapt to Telegram, Discord, CLI context

## Interfaces

### 🖥️ Web Terminal (Main) — Always Active

A **full Bash terminal** in your browser via [ttyd](https://github.com/tsl0922/ttyd):

- **URL**: `http://your-server-ip:9119`
- Full shell access: `docker ps`, `ls`, `cat`, `hermes gateway status`
- All Hermes data accessible via `/opt/data`
- No SSH needed — everything from the browser

### 📱 Dashboard (Optional)

The built-in **chat-based Dashboard UI** for managing sessions, skills, and configuration:

- Enable via Runtipi config → "Enable Dashboard (Optional Web UI)"
- **URL**: `http://your-server-ip:9120` (when enabled)
- Chat with Hermes, monitor usage, manage skills

### 📡 OpenAI API (Optional)

Exposes an OpenAI-compatible API for external tools (OpenWebUI, etc.):

- Enable via Runtipi config → "Enable API Server"
- **URL**: `http://your-server-ip:8642/v1` (when enabled)

## Setup Options

### Required Fields (Optional - Choose Your Setup)

| Field | Description |
|-------|-------------|
| **OpenRouter API Key** | Get at https://openrouter.ai/keys - access to 60+ models |
| **Telegram Bot Token** | Get from @BotFather - enables Telegram gateway |

### Optional Configuration

| Field | Default | Description |
|-------|---------|-------------|
| **Default Model** | `anthropic/claude-sonnet-4` | LLM model for cloud APIs |
| **Local Model URL** | - | Local LLM server (e.g. `http://host.docker.internal:1234/v1`) |
| **Enable Dashboard** | Disabled | Chat UI at port 9120 |
| **Enable API Server** | Disabled | OpenAI-compatible API for external tools |
| **API Server Key** | - | Minimum 8 chars when API Server is on |
| **API Server Port** | `8642` | Port for the API server |

## Access Summary

| Interface | Port | Access |
|-----------|------|--------|
| **Web Terminal (ttyd)** | 9119 | `http://<ip>:9119` — **always active** |
| Dashboard UI | 9120 | `http://<ip>:9120` — optional |
| OpenAI API | 8642 | `http://<ip>:8642/v1` — optional |

## Source & Documentation

- **GitHub**: https://github.com/NousResearch/hermes-agent
- **Documentation**: https://hermes-agent.nousresearch.com/

## Docker Image

This app uses the official image: `nousresearch/hermes-agent:latest`
- **Pulls**: 286,000+
- **Architectures**: amd64, arm64

## License

MIT License - see the [GitHub repository](https://github.com/NousResearch/hermes-agent) for details.
