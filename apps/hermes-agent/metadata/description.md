# Hermes Agent

**Autonomous AI agent for CLI - automate tasks with natural language**

Hermes is a privacy-first autonomous AI agent that runs directly in your terminal. Give it tasks in natural language and watch it execute complex workflows using a powerful suite of tools including browsers, file systems, APIs, databases, and more.

## Features

### 🤖 Autonomous Task Execution
- Give Hermes a task in natural language
- It plans, executes, and adapts autonomously
- Handles complex multi-step workflows

### 🛠️ Powerful Tool Suite
- **Browser Automation**: Navigate, click, type, extract data from websites
- **File Operations**: Read, write, search, and edit files
- **Terminal Commands**: Execute shell commands safely
- **Web Search**: Private search via SearXNG or other backends
- **APIs**: Interact with GitHub, Google Workspace, and more
- **Local Models**: Run with LM Studio for complete privacy

### 🔒 Privacy-First Design
- Supports local LLM inference (LM Studio, llama.cpp)
- No data leaves your machine when using local models
- Self-hosted search via SearXNG
- Full control over your data and workflows

### 📚 Skills System
- Reusable workflows for common tasks
- Community-contributed skills
- Extend Hermes with custom capabilities

## Use Cases

### Development & DevOps
- Code review and debugging
- Git workflow management
- CI/CD pipeline operations
- Server administration

### Research & Data
- Academic paper discovery (arXiv)
- Blog monitoring and RSS feeds
- Data analysis with Jupyter notebooks
- Web scraping and data extraction

### Productivity
- Email management via IMAP/SMTP
- Calendar operations (Google Calendar)
- Document creation and editing
- Smart home automation

### Creative Projects
- ASCII art generation
- Music generation (Suno, AudioCraft)
- Image generation (Pollinations, Stable Diffusion)
- Video creation with Manim

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_PROVIDER` | API provider (openai, anthropic, local) | openai |
| `API_KEY` | API key for cloud providers | - |
| `MODEL_NAME` | Model name to use | gpt-4o |
| `API_SERVER_ENABLED` | Enable web API server | false |
| `API_SERVER_PORT` | Port for API server | 8080 |

### Local Model Setup

For complete privacy, run Hermes with local models:

1. Install [LM Studio](https://lmstudio.ai/)
2. Download a model (e.g., qwen3.5-122b, llama-3)
3. Start LM Studio server on port 1234
4. Configure Hermes:
   ```bash
   hermes config set api_provider local
   hermes config set model_name your-model-name
   ```

## Integration with OpenWebUI

Hermes can be accessed via web interface:

1. Enable API server in Hermes config
2. Add Hermes as a tool in OpenWebUI
3. Configure endpoint: `http://hermes-agent:8080/v1`

## Docker Deployment

This RunTipi app deploys Hermes in a container with:
- Persistent data volume for configs and skills
- Configurable API provider and model
- Optional web API server for remote access

## Source & Documentation

- **GitHub**: https://github.com/traianstamatescu/hermes-agent
- **Documentation**: https://hermes-agent.com

## License

MIT License - see the [GitHub repository](https://github.com/traianstamatescu/hermes-agent) for details.
