# Agent Instructions for Student-PA

This file contains the background, conventions, and workflows that coding agents need to know when working on the **Student-PA** codebase.

> **Project Name**: Student Personal Assistant (Student-PA)  
> **License**: AGPL v3  
> **Repository**: `https://github.com/abenable/student-pa`

---

## 1. What This Project Is

Student-PA is an **open-source AI agent platform for university students**. Each student gets their own isolated, containerized [Hermes Agent](https://hermes-agent.nousresearch.com/) instance accessible via Telegram. It ships with five pre-built academic workflows and a web dashboard for management.

### Key Capabilities
- **Personal AI Agent** per student via Telegram
- **5 Pre-built Services**:
  1. Inbox & Calendar Manager (Gmail + Google Calendar via GWS CLI)
  2. Lab Report LaTeX Typesetter (raw notes/CSV → PDF)
  3. Job Application Engine (scrape listings, draft cover letters, log to Sheets)
  4. Academic Paper Interrogator (extract problem/methodology/results from PDFs)
  5. Lecture & Video Summarizer (YouTube transcripts → study guides)
- **Multi-tenant by Design** — one signup bot provisions isolated containers per student
- **Secure API Key Management** — per-student LiteLLM keys with model restrictions

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Student-PA Platform                     │
├─────────────┬─────────────┬─────────────────────────────────┤
│     Web     │   Worker    │         Agent (per student)      │
│  Dashboard  │  Provisioner│                                  │
│  (React 19) │  (FastAPI)  │  ┌───────────────────────────┐  │
│  TanStack   │  Telegram   │  │   Hermes Agent Container  │  │
│  Prisma DB  │  BotFather  │  │   - GWS CLI               │  │
│             │  Orchestrator│  │   - LaTeX / pdflatex      │  │
│             │             │  │   - Pre-built services      │  │
│             │             │  │   - Memory & sessions       │  │
└─────────────┴─────────────┴──┴───────────────────────────┴──┘
                      │
               LiteLLM Gateway
          (OpenAI-compatible proxy)
```

- **Web Dashboard** (`:3000`) — Student registration, admin tools, agent status.
- **Worker** (`:8000`) — FastAPI service that runs the signup bot, automates BotFather, generates LiteLLM keys, and spins up agent containers.
- **Agent** — One Docker container per student. Runs Hermes Agent with Telegram gateway, GWS CLI, LaTeX, and PDF tools.

---

## 3. Repository Layout

```
student-pa/
├── agent/                  # Hermes Agent Docker image & service templates
│   ├── Dockerfile          # Multi-stage build (Node 24 Alpine + Python venv)
│   ├── config.yaml         # Hermes runtime configuration (mounted into containers)
│   ├── docker-compose.yml  # Standalone agent dev mode
│   └── services/           # 5 pre-built student workflow MD files
│       ├── inbox_calendar_manager.md
│       ├── lab_report_latex_generator.md
│       ├── job_application_engine.md
│       ├── paper_interrogator.md
│       └── lecture_summarizer.md
│
├── web/                    # TanStack Start full-stack dashboard
│   ├── package.json
│   ├── Dockerfile
│   ├── vite.config.ts
│   └── src/
│       ├── routes/         # File-based TanStack Router routes
│       ├── lib/            # Auth, email, utilities
│       ├── components/     # React components (shadcn/ui + custom)
│       ├── db.ts           # Prisma client
│       └── styles.css      # Tailwind CSS v4 entry
│
├── worker/                 # FastAPI provisioner & signup bot
│   ├── main.py             # FastAPI entry point (lifespan + endpoints)
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile
│   ├── auth_telethon.py    # One-time Telethon authentication script
│   └── app/
│       ├── core/           # Config, models, exceptions, utils
│       ├── services/       # LiteLLM key gen, BotFather automation
│       ├── runtime/        # Docker container lifecycle, storage
│       └── telegram/       # python-telegram-bot signup bot logic
│
├── docs/                   # Project documentation
│   ├── SETUP.md            # Full installation & configuration guide
│   └── ARCHITECTURE.md     # Deep-dive into design decisions
│
├── docker-compose.yml      # Root orchestration (web + worker)
├── .env.example            # Template for all required secrets
├── install.sh              # Single-student standalone installer
├── CHANGELOG.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── SECURITY.md
```

### Important Paths
| Path | Purpose |
|------|---------|
| `./agents/` | Runtime per-student agent directories (contains secrets). Never committed. |
| `./worker/sessions/` | Telethon session files (sensitive). Never committed. |
| `./.env` | All secrets and configuration. Never committed. |

---

## 4. Technology Stack

### Web Dashboard
| Layer | Technology |
|-------|------------|
| Framework | [TanStack Start](https://tanstack.com/start) (full-stack React) |
| UI Library | React 19 |
| Routing | TanStack Router (file-based) |
| Styling | Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com/) |
| Auth | Better Auth (PostgreSQL adapter, cookie-based) |
| ORM | Prisma (PostgreSQL) |
| Build Tool | Vite |
| Test Runner | Vitest |
| Package Manager | pnpm / bun |
| Lint / Format | ESLint (tanstack config) + Prettier |

### Worker
| Layer | Technology |
|-------|------------|
| Framework | FastAPI (Python 3.11+) |
| Telegram Bot | `python-telegram-bot` |
| BotFather Automation | Telethon (MTProto client) |
| Container Orchestration | Docker SDK for Python |
| HTTP Client | `httpx` |
| Package Manager | `uv` |

### Agent Container
| Layer | Technology |
|-------|------------|
| Base Image | `node:24-alpine` |
| Agent Framework | Hermes Agent (Python venv) |
| LLM Client | OpenAI-compatible (LiteLLM proxy) |
| Google Workspace | GWS CLI (`@googleworkspace/cli`) |
| PDF / Text | PyMuPDF |
| Video | yt-dlp |
| Typesetting | TeX Live + pandoc |

### Infrastructure
- **Docker Compose** for local dev and single-host deployments
- **PostgreSQL** for web dashboard persistence
- **LiteLLM** for model routing, key generation, and spend tracking
- **Docker socket mounting** for worker container orchestration

---

## 5. Development Environment Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 24+ and pnpm (for web)
- Python 3.11+ and uv (for worker)
- A LiteLLM instance or OpenAI-compatible API endpoint
- A Telegram bot token from [@BotFather](https://t.me/botfather)

### Quick Start
```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your keys

# 2. Build and start core services
docker compose up -d --build

# 3. Build the agent image (required before provisioning)
cd agent && docker build -t student-pa-agent:latest .

# 4. (Optional) Run web dev server with hot reload
cd web && pnpm install && pnpm run dev

# 5. (Optional) Run worker locally with reload
cd worker && uv pip install -r requirements.txt
uv run uvicorn main:api --reload --port 8000
```

### Health Checks
```bash
# Worker health
docker compose exec worker curl -f http://localhost:8000/health

# Web dashboard
open http://localhost:3000
```

---

## 6. Coding Conventions

### Git
- **Conventional Commits** (`<type>(<scope>): <summary>`)
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
- Branch naming: `feature/description`, `fix/description`, `docs/description`, `refactor/description`
- One logical change per PR. Link issues with `Closes #123`.

### Python (Worker)
- Follow **PEP 8**.
- Use **type hints** everywhere possible.
- Use `async`/`await` for I/O-bound operations (FastAPI, HTTP, Docker, Telegram).
- Keep functions focused; aim for under 50 lines.
- Use `logger` (not `print`) for diagnostics.
- Import style: stdlib → third-party → local (`app.core...`, `app.runtime...`).

### TypeScript / React (Web)
- **Functional components** and hooks only.
- Prefer **explicit types** over `any`.
- Use **Tailwind CSS** utility classes for styling; avoid arbitrary values when possible.
- Use **shadcn/ui** components where appropriate. Add new ones via:
  ```bash
  pnpm dlx shadcn@latest add button
  ```
- File-based routing: add routes under `web/src/routes/`.
- Server functions: use `createServerFn` from `@tanstack/react-start`.
- API routes: use the `server.handlers` property in route definitions.
- Run `pnpm run format` before committing.

### Docker
- Agent image is **multi-stage** to keep runtime small.
- Run containers as **non-root** (`hermes` user).
- Drop capabilities to the minimum required set.
- Use `no-new-privileges:true`.

---

## 7. Build, Test, and Deploy Commands

### Web (`web/`)
```bash
pnpm install
pnpm run dev          # Dev server on :3000
pnpm run build        # Production build
pnpm run preview      # Preview production build
pnpm run test         # Vitest
pnpm run lint         # ESLint
pnpm run format       # Prettier + ESLint --fix
pnpm run check        # Prettier --check

# Database
pnpm run db:generate  # Prisma generate
pnpm run db:push      # Prisma db push
pnpm run db:migrate   # Prisma migrate dev
pnpm run db:studio    # Prisma Studio
```

### Worker (`worker/`)
```bash
uv pip install -r requirements.txt
uv run uvicorn main:api --reload --port 8000

# Telethon authentication (one-time)
uv run python auth_telethon.py
```

### Agent (`agent/`)
```bash
docker build -t student-pa-agent:latest .
```

### Root (Full Platform)
```bash
docker compose up -d --build
docker compose ps
docker compose logs -f worker
docker compose logs -f web
```

---

## 8. Security Rules

1. **Never commit secrets**
   - `.env` is gitignored.
   - `worker/sessions/` is gitignored.
   - `agents/` (runtime per-student data) is gitignored.

2. **Sensitive files**
   - `worker/sessions/*` — Telethon session files. Treat as credentials.
   - `agents/{user_id}/secrets.json` — Bot tokens and LiteLLM keys.
   - `agents/{user_id}/agent.json` and `onboarding.json` — Student metadata and provisioning state.
   - Back up these directories only to **encrypted storage**.

3. **API Authentication**
   - Worker endpoints require the `x-secret` header matching `PROVISIONER_SECRET`.
   - This must be a long random string in production.

4. **Container Security**
   - Agent containers run as non-root (`hermes` user).
   - Docker capabilities are dropped.
   - `no-new-privileges:true` is enforced.

5. **Database**
   - PostgreSQL is used via Prisma.
   - Better Auth handles password hashing and session cookies.

---

## 9. Common Tasks for Agents

### Adding a New Web Route
1. Create a new file under `web/src/routes/` (e.g., `dashboard/reports.tsx`).
2. TanStack Router will auto-generate the route tree on next dev start.
3. Export `Route` using `createFileRoute('/dashboard/reports')`.
4. Use `createServerFn` for server-side data fetching or mutations.

### Adding a New Worker Endpoint
1. Add the route in `worker/main.py` using FastAPI decorators.
2. Use `_check_secret(x_secret)` for protected endpoints.
3. Place business logic in `worker/app/runtime/` or `worker/app/services/`.
4. Define request/response models in `worker/app/core/models.py`.
5. Add custom exceptions in `worker/app/core/exceptions.py`.

### Adding a New Pre-built Service
1. Create a new Markdown file in `agent/services/` describing the workflow.
2. Update `agent/services/README.md` to list the new service.
3. Services are executed by Hermes reading the MD file and running the workflow.

### Modifying the Agent Image
1. Edit `agent/Dockerfile`.
2. Rebuild: `cd agent && docker build -t student-pa-agent:latest .`
3. Update `AGENT_IMAGE` in `.env` if the tag changes.

### Database Schema Changes
1. Edit the Prisma schema (if applicable; schema file may be in `web/prisma/`).
2. Run `pnpm run db:generate` and `pnpm run db:migrate` inside `web/`.
3. Update any affected TypeScript types.

---

## 10. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Container-based isolation** | Strong separation between students; crashes, file ops, and secrets are per-user. |
| **Two-phase provisioning** | Phase 1 (BotFather + LiteLLM key) can succeed while Phase 2 (Docker) fails. This lets students retry container startup without creating duplicate bots. |
| **Hermes Agent** | Terminal-based agent framework with built-in tool use, memory, and messaging gateway support. |
| **TanStack Start** | Full-stack React with server functions, file-based routing, and type-safe data fetching. |
| **LiteLLM** | OpenAI-compatible proxy enables Hermes to work out of the box while providing multi-tenant key management and spend tracking. |

---

## 11. Troubleshooting Quick Reference

| Symptom | Fix |
|---------|-----|
| `host.docker.internal` fails on Linux | Already handled by `extra_hosts` in `docker-compose.yml`. If LiteLLM is remote, use its public URL. |
| Hermes says "provider not configured" | Verify `LITELLM_ADMIN_KEY` / `DEFAULT_MODEL` in `.env`. Run `hermes setup --non-interactive` inside the agent container. |
| Agent container fails to start | Check `docker logs student-pa-worker`. Ensure `student-pa-agent:latest` exists: `docker images \| grep student-pa-agent`. |
| LaTeX compilation fails | Install missing packages in `agent/Dockerfile` via `apk add texmf-dist-<package>`. |
| BotFather rate limiting | Wait a few minutes; use `/retry` in the signup bot. Check worker logs. |
| Cannot auth Telethon | Ensure 2FA is disabled or use an app password. Use the code sent to the Telegram app, not SMS. |

---

## 12. Communication Boundaries

- **Web** talks to **Database** (PostgreSQL) and **Worker** (REST API with `x-secret`).
- **Worker** talks to **Telegram** (signup bot polling), **BotFather** (Telethon), **LiteLLM** (HTTP API), and **Docker daemon** (socket-mounted).
- **Agent** talks to **Telegram** (student's personal bot), **LiteLLM** (LLM requests), and **Google Workspace** (GWS CLI OAuth).
- The **Web dashboard does not talk directly to Agent containers** — all agent lifecycle operations go through the Worker.

---

## 13. Contact & Resources

- **Setup Guide**: `docs/SETUP.md`
- **Architecture Deep Dive**: `docs/ARCHITECTURE.md`
- **Contributing Guide**: `CONTRIBUTING.md`
- **Security Policy**: `SECURITY.md`
- **Agent Services**: `agent/services/README.md`
- **Web Docs**: `web/README.md`

If you change anything documented here — build steps, tech stack, security rules, or project structure — **update this file** to keep it accurate for future agents.
