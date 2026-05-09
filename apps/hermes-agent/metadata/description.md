# Hermes Agent

**Autonomous AI agent with persistent memory, multi-platform gateway, and self-improving skills system**

Hermes is an open-source AI agent framework that runs autonomously in your terminal or as a service. It features persistent memory across sessions, a multi-platform gateway (Telegram, Discord, WhatsApp, Slack, etc.), and a self-improving skills system. Supports both cloud APIs (OpenRouter) and local LLMs (LM Studio, llama.cpp) for privacy-first operation.

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

## Use Cases

### Development & DevOps
- Code review and debugging assistance
- Git workflow management (branches, PRs, commits)
- GitHub repository operations
- CI/CD pipeline management

### Research & Data Science
- Academic paper discovery (arXiv integration)
- Blog monitoring and RSS feed tracking
- Data analysis with Jupyter notebooks
- Web scraping and data extraction

### Productivity & Automation
- Email management via IMAP/SMTP
- Calendar operations (Google Calendar)
- Document creation and editing
- Smart home automation (Home Assistant)

### Creative Projects
- ASCII art generation with pyfiglet/cowsay
- Music generation (Suno, AudioCraft)
- Image generation (Pollinations, Stable Diffusion)
- Video creation with Manim

## Configuration via RunTipi

### Required Fields (Optional - Choose Your Setup)

| Field | Description |
|-------|-------------|
| **OpenRouter API Key** | Get at https://openrouter.ai/keys - gives access to 60+ models from multiple providers |
| **Telegram Bot Token** | Get from @BotFather - enables Telegram gateway for messaging interface |

### Optional Configuration

| Field | Default | Description |
|-------|---------|-------------|
| **Default Model** | `anthropic/claude-sonnet-4` | Default LLM model for cloud APIs |
| **Local Model URL** | - | URL for local LLM server (e.g. `http://host.docker.internal:1234/v1` for LM Studio) |
| **Enable API Server** | Disabled | Enable web API server for OpenWebUI or custom integrations |
| **API Server Port** | `8080` | Port for the API server |

## Setup Options

### IMPORTANT: Gateway Mode

Hermes Agent runs as a **persistent gateway daemon** (not interactive CLI). It connects to messaging platforms and exposes an OpenAI-compatible API on port 8642.

### 🖥️ Web Dashboard

By default, the **built-in web dashboard** is enabled and accessible at:
- **URL**: `http://your-server-ip:9119`
- Manage AI chat sessions, monitor usage, configure platforms, and manage skills

### 🌐 Web Terminal (ttyd)

Ein **vollständiges Web-Terminal** mit Bash-Shell — arbeite direkt im Container:

- **URL**: `http://deine-server-ip:9200`
- Volle Shell-Zugriff: `docker ps`, `ls`, `cat`, `hermes gateway status`
- Aktiviert alle Hermes-Daten (Sessions, Skills, Config) über `/opt/data`
- Kein SSH nötig — alles über den Browser

### Option 1: Cloud APIs (Easiest)
1. Get an OpenRouter API key at https://openrouter.ai/keys
2. Enter it in the RunTipi configuration
3. Hermes will use cloud LLMs (pay-per-use, 60+ models available)

### Option 2: Local Models (Privacy-First)
1. Install LM Studio or Ollama on the host machine
2. Download a model (e.g., qwen3.5-122b, llama-3)
3. Start the local server on port 1234
4. Set Local Model URL to `http://host.docker.internal:1234/v1`
5. No API key needed — completely offline operation

### Option 3: Telegram Gateway
1. Create a bot with @BotFather on Telegram
2. Get the bot token
3. Enter it in RunTipi configuration
4. Hermes starts as a persistent gateway — chat via Telegram!

### Option 4: OpenWebUI Integration
1. Enable "API Server" in RunTipi configuration
2. Set an API Server Key (minimum 8 characters)
3. In OpenWebUI settings, add base URL: `http://your-server:8642/v1`
4. Use the API Key in OpenWebUI model configuration

## Persistent Data

Hermes stores data in a named volume (`hermes-data`):
- `~/.hermes/config.yaml` - User configuration
- `~/.hermes/sessions/` - Conversation history
- `~/.hermes/skills/` - Installed skills
- `~/.hermes/memory.db` - Persistent memory database

Data persists across container restarts and updates.

## Source & Documentation

- **GitHub**: https://github.com/NousResearch/hermes-agent
- **Documentation**: https://hermes-agent.nousresearch.com/

## Docker Image

This app uses the official image: `nousresearch/hermes-agent:latest`
- **Pulls**: 286,000+
- **Architectures**: amd64, arm64
- **Last Updated**: Regular updates

## License

MIT License - see the [GitHub repository](https://github.com/NousResearch/hermes-agent) for details.
