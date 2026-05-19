# Student Personal Assistant (Student-PA)

A Dockerized [Hermes Agent](https://hermes-agent.nousresearch.com/) template pre-configured for university students. It bundles scheduling, document generation, academic research, and job-hunting workflows.

## What's Inside

- **Base Image:** `node:24-alpine` (multi-stage build for minimal size)
- **Agent Engine:** [Hermes Agent](https://pypi.org/project/hermes-agent/) (Nous Research)
- **LLM Gateway:** Self-hosted LiteLLM (OpenAI-compatible proxy for model routing + token billing)
- **Pre-built Services:** 5 student workflow templates in `/services/`
- **Extras Installed:** GWS CLI, YouTube, Web, Cron, Messaging

## Quick Start

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env with your LiteLLM URL and API key
```

### 2. Build & Start

```bash
docker compose up -d --build
```

> **Linux users:** If LiteLLM runs on the host, `host.docker.internal` is mapped automatically via `extra_hosts`. If it runs elsewhere, set the full URL in `.env`.

### 3. Initialize Hermes (first run only)

```bash
docker exec -it student-pa-agent hermes setup --non-interactive
```

### 4. Run a Service

Hermes one-shot mode (`-z`) returns clean text — perfect for scripting:

```bash
docker exec -it student-pa-agent hermes -z \
  "Read /app/services/inbox_calendar_manager.md and execute that workflow on my unread emails."
```

Or use interactive chat:

```bash
docker exec -it student-pa-agent hermes chat -q \
  "Generate a LaTeX lab report from /home/hermes/student-data/lab3_notes.txt and compile it to PDF."
```

## Hermes Management Commands

| Command | Purpose |
|---------|---------|
| `hermes` | Interactive TUI / CLI chat |
| `hermes -z "prompt"` | Scripted one-shot (clean stdout) |
| `hermes chat -q "prompt"` | One-shot with tool transcript |
| `hermes model` | Change provider / model |
| `hermes tools` | Enable/disable toolsets |
| `hermes cron list` | View scheduled jobs |
| `hermes gateway run` | Start messaging gateway (Telegram, etc.) |
| `hermes doctor` | Diagnose issues |

## Out-of-the-Box Services (`/services/`)

| # | Service | File |
|---|---------|------|
| 1 | **Inbox & Calendar Manager** | `inbox_calendar_manager.md` |
| 2 | **Lab Report LaTeX Typesetter** | `lab_report_latex_generator.md` |
| 3 | **Job Application Engine** | `job_application_engine.md` |
| 4 | **Academic Paper Interrogator** | `paper_interrogator.md` |
| 5 | **Lecture & Video Summarizer** | `lecture_summarizer.md` |

## Data Persistence

| Host Path | Container Path | What's Stored |
|-----------|----------------|---------------|
| `./hermes-data` | `/home/hermes/.hermes` | Config, memory, skills, sessions, logs |
| `./services` | `/app/services` | OOTB workflow templates (read-only) |
| `./student-data` | `/home/hermes/student-data` | Student uploads (resumes, lab data, PDFs) |

## Google Workspace Integration (via GWS CLI)

All Gmail, Calendar, Docs, and Sheets operations go through the **GWS CLI** (installed from `npm`).

### 1. Authenticate GWS

Run once per student. Credentials are persisted in `./gws-auth`:

```bash
docker exec -it student-pa-agent bash
gws auth login
```

> **Heads-up for unverified OAuth apps:** Google limits testing-mode apps to ~25 scopes. If `gws auth login` fails with "too many scopes", request only the services you need:
> ```bash
> gws auth login --scopes drive,gmail,calendar,sheets,docs
> ```

### 2. Verify

```bash
docker exec -it student-pa-agent gws gmail +triage
gws calendar +agenda
```

> **Note:** The volume `./gws-auth:/home/hermes/.gws` ensures the OAuth tokens survive container restarts. Do not commit this directory.

### 3. Headless / CI reuse

If you need to copy credentials to another machine:

```bash
docker exec -it student-pa-agent bash
gws auth export --unmasked > /home/hermes/student-data/gws-credentials.json
```

Then on the target machine set `GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE=/path/to/gws-credentials.json`.

## Optional: Telegram Gateway

Uncomment the Telegram variables in `.env`, then:

```bash
docker exec -it student-pa-agent hermes gateway run
```

The agent will respond to DMs and can deliver cron summaries to your Telegram chat.

## Security Notes

- The container runs as a non-root (`hermes`) user.
- API keys live only in `.env` and the container's `~/.hermes/.env` — never committed.
- Docker capabilities are dropped to the minimal set required.
- See `.gitignore` to ensure sensitive paths are never tracked.

## Troubleshooting

**`host.docker.internal` does not resolve (Linux)**  
The `docker-compose.yml` includes `extra_hosts` for this. If your LiteLLM is on a different host, use the direct IP/URL in `.env` instead.

**Hermes says "provider not configured"**  
Run `docker exec -it student-pa-agent hermes model` to select a model interactively, or ensure `LITELLM_API_BASE` and `LITELLM_API_KEY` are set in `.env`.

**LaTeX compilation fails**  
The image installs `texlive` and `texmf-dist-latexextra` (Alpine packages). If a specific `.sty` file is missing, install the corresponding `texmf-dist-*` package at build time in the Dockerfile.

**`marker-pdf` is not installed**  
To keep the Alpine image small, `marker-pdf` (which pulls in PyTorch) was omitted. PDF extraction uses `pymupdf` instead. If you need `marker-pdf`, switch to the Ubuntu-based Dockerfile or install it manually.
