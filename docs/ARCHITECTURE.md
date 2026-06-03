# Architecture Overview

This document describes the high-level design of Student-PA, how its components interact, and the decisions behind its architecture.

## Table of Contents

- [High-Level Diagram](#high-level-diagram)
- [Components](#components)
  - [Web](#web)
  - [Worker](#worker)
  - [Agent](#agent)
- [Data Flow](#data-flow)
- [Multi-Tenancy Model](#multi-tenancy-model)
- [Security Model](#security-model)
- [Technology Choices](#technology-choices)
- [Scalability Considerations](#scalability-considerations)

---

## High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           STUDENTS                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │  Telegram   │  │   Web UI    │  │      Google Workspace       │  │
│  │    DMs      │  │  (Browser)  │  │   (Gmail, Calendar, Docs)   │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┬───────────────┘  │
└─────────┼────────────────┼───────────────────────┼──────────────────┘
          │                │                       │
          ▼                ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         STUDENT-PA PLATFORM                         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        Docker Host                           │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │   │
│  │  │   Web Service   │  │ Worker Service  │  │   Database  │ │   │
│  │  │   (Port 3000)   │  │   (Port 8000)   │  │ (PostgreSQL)│ │   │
│  │  │                 │  │                 │  │             │ │   │
│  │  │ • TanStack Start│  │ • FastAPI       │  │ • Users     │ │   │
│  │  │ • React 19      │  │ • Telegram Bot  │  │ • Agents    │ │   │
│  │  │ • Better Auth   │  │ • BotFather API │  │ • Sessions  │ │   │
│  │  │ • Prisma ORM    │  │ • Docker SDK    │  │             │ │   │
│  │  └────────┬────────┘  └────────┬────────┘  └─────────────┘ │   │
│  │           │                    │                           │   │
│  │           └────────────────────┘                           │   │
│  │                    │                                       │   │
│  │           ┌────────▼────────┐                              │   │
│  │           │  LiteLLM Gateway │  (Key management & routing) │   │
│  │           │  (External/API)  │                              │   │
│  │           └─────────────────┘                              │   │
│  │                    ▲                                       │   │
│  │                    │ creates key per student                │   │
│  │  ┌─────────────────┼─────────────────────────────────────┐ │   │
│  │  │         Per-Student Agent Containers                  │ │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐    ┌─────────┐  │ │   │
│  │  │  │ Agent 1 │ │ Agent 2 │ │ Agent 3 │... │ Agent N │  │ │   │
│  │  │  │(Hermes) │ │(Hermes) │ │(Hermes) │    │(Hermes) │  │ │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘    └─────────┘  │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Components

### Web

**Purpose**: The public-facing dashboard where students and admins interact with the platform.

**Stack**:
- [TanStack Start](https://tanstack.com/start) — Full-stack React framework
- [React 19](https://react.dev/) — UI library
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [Better Auth](https://www.better-auth.com/) — Authentication
- [Prisma](https://www.prisma.io/) — Database ORM with PostgreSQL

**Responsibilities**:
- Student registration and login
- Admin dashboard for managing agents
- Displaying agent status and usage metrics
- Proxying requests to the worker (future roadmap)

**Communication**:
- Talks to the **Database** for user/session data.
- Talks to the **Worker** for provisioning operations.

---

### Worker

**Purpose**: The orchestration layer. It handles signup, bot creation, API key generation, and container lifecycle.

**Stack**:
- [FastAPI](https://fastapi.tiangolo.com/) — Python async web framework
- [python-telegram-bot](https://python-telegram-bot.org/) — Telegram bot framework
- [Telethon](https://docs.telethon.dev/) — Telegram MTProto client (for BotFather automation)
- [Docker SDK for Python](https://docker-py.readthedocs.io/) — Container orchestration

**Responsibilities**:
- Run the **signup bot** that students interact with to create their agent.
- Automate **BotFather** to create personal Telegram bots for each student.
- Generate **per-student LiteLLM keys** via the LiteLLM admin API.
- **Spin up and manage** Docker containers for each student agent.
- Expose a REST API for the web dashboard to trigger provisioning.

**API Endpoints**:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | None | Health check |
| `/provision` | POST | `x-secret` | Phase 1: Create bot + LiteLLM key |
| `/provision/phase2` | POST | `x-secret` | Phase 2: Start agent container |
| `/provision/resume` | POST | `x-secret` | Resume from last known state |
| `/provision/status/{id}` | GET | `x-secret` | Get provisioning status |

**Two-Phase Provisioning**:

Provisioning is split into two phases to handle partial failures gracefully:

1. **Phase 1** (async-safe): Creates the Telegram bot via BotFather and generates a LiteLLM key.
2. **Phase 2** (Docker-dependent): Spins up the agent container using the bot token and API key from Phase 1.

If Phase 2 fails (e.g., Docker daemon is down), the student can retry later without creating duplicate bots.

---

### Agent

**Purpose**: The actual AI assistant that students chat with. Each student gets their own isolated container.

**Stack**:
- [Hermes Agent](https://hermes-agent.nousresearch.com/) — Nous Research's agent framework
- [LiteLLM](https://docs.litellm.ai/) client — For model routing
- [GWS CLI](https://github.com/googleworkspace/google-workspace-cli) — Google Workspace integration
- [TeX Live](https://tug.org/texlive/) — For PDF compilation
- [PyMuPDF](https://pymupdf.readthedocs.io/) — PDF text extraction

**Responsibilities**:
- Respond to student messages via Telegram
- Execute pre-built services (inbox management, LaTeX generation, etc.)
- Maintain memory and session state across conversations
- Integrate with Google Workspace for email, calendar, and document operations

**Data Persistence** (per container):

| Host Path | Container Path | Contents |
|-----------|----------------|----------|
| `./agents/{user_id}/hermes-data` | `/home/hermes/.hermes` | Config, memory, skills, logs |
| `./agents/{user_id}/student-data` | `/home/hermes/student-data` | Uploaded files, resumes, lab data |

The worker also writes runtime provisioning files under `./agents/{user_id}`. Files such as `secrets.json`, `agent.json`, and `onboarding.json` contain bot tokens, LiteLLM keys, student identifiers, and provisioning state, so operators should treat the whole per-student runtime directory as sensitive.

---

## Data Flow

### New Student Onboarding

```
Student sends /start to Signup Bot
           │
           ▼
    ┌──────────────┐
    │    Worker    │  ← Telegram update received
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   BotFather  │  ← Worker creates bot via Telethon
    └──────┬───────┘
           │ Returns bot token & username
           ▼
    ┌──────────────┐
    │   LiteLLM    │  ← Worker generates per-student API key
    └──────┬───────┘
           │ Returns restricted key
           ▼
    ┌──────────────┐
    │    Docker    │  ← Worker spins up agent container
    └──────┬───────┘
           │ Container running
           ▼
    ┌──────────────┐
    │ Student Bot  │  ← Student now chats with their personal agent
    └──────────────┘
```

### Student Chat Session

```
Student sends message to their personal bot
           │
           ▼
    ┌──────────────┐
    │  Telegram    │  ← Webhook / polling
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │Agent Container│ ← Hermes processes message
    └──────┬───────┘
           │
      ┌────┴────┐
      ▼         ▼
┌──────────┐ ┌──────────┐
│  LiteLLM │ │  Google  │ ← External API calls
│ Gateway  │ │ Workspace│
└──────────┘ └──────────┘
```

---

## Multi-Tenancy Model

Student-PA uses **container-based isolation** for multi-tenancy:

- Each student = one Docker container.
- Containers share the host kernel but have isolated filesystems, processes, and environment variables.
- No shared memory or state between agents.
- Per-student LiteLLM keys allow usage tracking and rate limiting per user.

### Why Containers Over Threads?

| Approach | Pros | Cons |
|----------|------|------|
| **Containers** (chosen) | Strong isolation, independent scaling, crashes don't affect others, easy to debug per user | Higher resource usage, slower startup |
| **Threads / Async** | Lower overhead, faster startup | Shared state risks, harder to debug, one crash affects all |

For a university deployment with dozens or hundreds of students, containers provide the safest balance of isolation and operational simplicity.

---

## Security Model

### Defense in Depth

1. **Network**: Services communicate over an internal Docker bridge network. Only `web` (port 3000) and `worker` health check are exposed externally.

2. **Container Runtime**:
   - Agents run as a non-root user (`hermes`).
   - Capabilities are dropped to the minimum set (`DAC_OVERRIDE`, `CHOWN`, `FOWNER`).
   - `no-new-privileges:true` prevents privilege escalation.

3. **Secrets**:
   - API keys never touch the filesystem unencrypted in the repo.
   - Worker stores bot tokens in `secrets.json` with `0o600` permissions.
   - `.env` and `*.session` files are gitignored.
   - Telethon session files under `./worker/sessions` can authorize BotFather automation as the configured Telegram account.
   - Per-agent runtime files under `./agents/{user_id}` include credentials and student metadata.
   - Back up Telethon sessions and agent runtime directories only to encrypted storage, and rotate leaked Telegram bot tokens, LiteLLM keys, and Telethon sessions deliberately.

4. **API Authentication**:
   - Worker endpoints require a shared `x-secret` header.
   - This should be a long random string in production.

5. **Telegram**:
   - Each agent container only accepts messages from its assigned student (`TELEGRAM_ALLOWED_USERS`).
   - Signup bot conversations are state-machine based to prevent injection.

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Student A accesses Student B's agent | Container isolation + Telegram user ID filtering |
| API key leak | Per-student keys allow revocation without affecting others |
| Malicious student uploads | Containers run as non-root with dropped capabilities |
| Bot token exposure | Stored with restrictive permissions; never logged in full |
| LLM prompt injection | Hermes skill guard + user confirmation for destructive actions |

---

## Technology Choices

### Why Hermes Agent?

Hermes provides a robust, terminal-based agent framework with:
- Built-in tool use (web search, file operations, cron jobs)
- Memory and user profiles
- Gateway support for messaging platforms (Telegram, etc.)
- Active development by Nous Research

### Why FastAPI + Telethon?

- **FastAPI**: Native async support, automatic OpenAPI docs, great Python ecosystem.
- **Telethon**: Required for BotFather automation (creating bots programmatically), which `python-telegram-bot` alone cannot do.

### Why TanStack Start?

- Full-stack React with server functions (no separate API layer needed for many features)
- File-based routing
- Excellent data fetching with TanStack Query
- TypeScript-first

### Why LiteLLM?

- OpenAI-compatible proxy means Hermes works out of the box.
- Built-in key management, rate limiting, and spend tracking.
- Supports 100+ LLM providers.

---

## Scalability Considerations

### Current Limits (Single Docker Host)

- Agent containers are limited by host RAM and disk.
- A typical agent container uses ~200-400 MB RAM when idle.
- Docker's default bridge network supports thousands of containers.

### Scaling Pathways

1. **Vertical Scaling**: Upgrade the host (more RAM, CPU, SSD).

2. **Container Orchestration**: Migrate to Kubernetes or Docker Swarm.
   - Worker becomes a Kubernetes operator.
   - Agents become Pods.
   - Persistent volumes for `hermes-data` and `student-data`.

3. **Worker Sharding**: Run multiple worker instances behind a load balancer, partitioned by user ID.

4. **LiteLLM Enterprise**: For high-volume usage, use LiteLLM's enterprise features like Redis caching and load balancing.

---

## Further Reading

- [docs/SETUP.md](SETUP.md) — How to install and run the platform.
- [CONTRIBUTING.md](../CONTRIBUTING.md) — How to contribute to the codebase.
- [Agent Services](../agent/services/README.md) — Deep dive into the pre-built student workflows.
