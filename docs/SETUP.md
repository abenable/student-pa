# Complete Setup Guide

This guide covers everything you need to get Student-PA running locally, in the cloud, or on a production server.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [LiteLLM Setup](#litellm-setup)
- [Telegram Configuration](#telegram-configuration)
- [Google Workspace Setup](#google-workspace-setup)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

Student-PA consists of three services that communicate over a Docker network:

1. **Web** (`:3000`) — The TanStack Start dashboard for students and admins.
2. **Worker** (`:8000`) — The FastAPI provisioner that creates Telegram bots, generates API keys, and spins up agent containers.
3. **Agent** — One container per student, created dynamically by the worker.

You can run everything with a single `docker compose up`, but there are a few external services you need to configure first.

---

## Prerequisites

### Required

| Tool | Version | Purpose |
|------|---------|---------|
| [Docker](https://docs.docker.com/get-docker/) | Latest | Container runtime |
| [Docker Compose](https://docs.docker.com/compose/) | v2+ | Multi-service orchestration |
| [Git](https://git-scm.com/) | Latest | Clone the repo |

### External Accounts

1. **LiteLLM or OpenAI-compatible API**
   - You need a running [LiteLLM](https://github.com/BerriAI/litellm) proxy **or** an OpenAI, OpenRouter, or similar API key.
   - This is what powers the AI agents.

2. **Telegram Bot Token**
   - Message [@BotFather](https://t.me/botfather) on Telegram.
   - Create a bot and save the HTTP API token.
   - This is the **signup bot** that students use to register.

3. **(Optional) Telegram API ID & Hash**
   - Only needed if you want the worker to automatically create bots via BotFather.
   - Get them from [my.telegram.org/apps](https://my.telegram.org/apps).

4. **(Optional) Google Workspace OAuth**
   - Needed for Gmail, Calendar, Docs, and Sheets integration.
   - See [Google Workspace Setup](#google-workspace-setup) below.

---

## Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/abenable/student-pa.git
cd student-pa
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in all required values. See the [Environment Variables](#environment-variables) section below for a full explanation.

The root `docker-compose.yml` loads this `.env` into both the `web` and `worker` services. Keep container paths such as `AGENTS_BASE_DIR=/agents` and `TELEGRAM_SESSION=/data/botfather_session` when using the included compose file; the host directories are mounted separately.

### 3. Build and Start

```bash
docker compose up -d --build
```

This will build and start the `web` and `worker` services. The `agent` image must be built separately (it is created on-demand by the worker).

### 4. Build the Agent Image

```bash
cd agent
docker build -t student-pa-agent:latest .
```

Make sure the `AGENT_IMAGE` in your `.env` matches this tag (e.g., `student-pa-agent:latest`).

### 5. Verify Everything is Running

```bash
# Check container status
docker compose ps

# Check worker health from inside the compose network
docker compose exec worker curl -f http://localhost:8000/health

# Check web dashboard
open http://localhost:3000
```

### 6. (Optional) Authenticate Telethon

If you want the worker to automatically create Telegram bots for students, you need to authenticate the Telethon session once:

```bash
cd worker
# Install dependencies locally
uv pip install -r pyproject.toml --extra dev
# Run auth script
uv run python auth_telethon.py
```

Follow the prompts to enter your phone number and Telegram confirmation code. This creates a session file that the worker uses to talk to BotFather.

---

## Environment Variables

Here are the deployment variables loaded from `.env` by the root Docker Compose setup:

### Database

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://...` | Full connection string for your existing PostgreSQL server |

### Web / Auth

| Variable | Example | Description |
|----------|---------|-------------|
| `BETTER_AUTH_URL` | `http://localhost:3000` | The public URL of your web app |
| `BETTER_AUTH_SECRET` | `random-string` | Secret for signing auth tokens |
| `WEB_PORT` | `3000` | Port the web service listens on |
| `WORKER_URL` | `http://worker:8000` | Internal worker URL used by the web service inside Docker Compose |

### SMTP (Optional)

| Variable | Example | Description |
|----------|---------|-------------|
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server for transactional emails |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_TLS` | `True` | Use TLS encryption |
| `SMTP_USERNAME` | `...` | SMTP login |
| `SMTP_PASSWORD` | `...` | SMTP password or app-specific password |

### LiteLLM / Model

| Variable | Example | Description |
|----------|---------|-------------|
| `LITELLM_ADMIN_KEY` | `sk-admin-...` | Master key for creating per-student keys |
| `DEFAULT_MODEL` | `gpt-4o` | Default model alias for agents |

> Your LiteLLM `config.yaml` should have a model called `DEFAULT_MODEL` that maps to an actual provider.

### Signup Bot

| Variable | Example | Description |
|----------|---------|-------------|
| `SIGNUP_BOT_TOKEN` | `123456:ABC...` | Telegram token for the public onboarding bot |

### Provisioner

| Variable | Example | Description |
|----------|---------|-------------|
| `PROVISIONER_SECRET` | `random-string` | Shared secret between web and worker |
| `AGENT_IMAGE` | `student-pa-agent:latest` | Docker image tag for student agents |
| `AGENTS_BASE_DIR` | `/agents` | Container path where the worker writes per-student runtime data. The root compose file mounts host `./agents` there. |
| `AGENT_DOCKER_NETWORK` | `student-pa` | Docker network used by the worker when starting per-student agent containers |
| `PROVISION_RETRIES` | `3` | Number of phase-2 container startup attempts |
| `PROVISION_RETRY_DELAY_SECONDS` | `10` | Delay between phase-2 retry attempts |

### Telethon / BotFather Automation

| Variable | Example | Description |
|----------|---------|-------------|
| `TELEGRAM_API_ID` | `12345678` | From my.telegram.org |
| `TELEGRAM_API_HASH` | `abc123...` | From my.telegram.org |
| `TELEGRAM_PHONE` | `+1234567890` | Your personal phone number |
| `TELEGRAM_SESSION` | `/data/botfather_session` | Container path to the Telethon session file. The root compose file mounts host `./worker/sessions` to `/data`. |

### Template Agent (Single-student Dev Mode)

| Variable | Example | Description |
|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | `...` | Direct bot token (skip signup bot) |
| `TELEGRAM_ALLOWED_USERS` | `123456` | Your Telegram user ID |

---

## LiteLLM Setup

Student-PA relies on LiteLLM to route requests and generate per-student API keys.

### Option A: Self-Hosted LiteLLM

1. Deploy LiteLLM using their [Docker guide](https://docs.litellm.ai/docs/proxy/deploy).
2. Set `LITELLM_ADMIN_KEY` to your LiteLLM master key.
3. Configure a model in LiteLLM that matches `DEFAULT_MODEL` in your `.env`.

Example `litellm_config.yaml`:

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

  - model_name: Mythos
    litellm_params:
      model: openai/Mythos
      api_base: https://your-gateway.com/v1
      api_key: os.environ/CUSTOM_API_KEY
```

### Option B: OpenAI Direct (Simpler, No Multi-tenancy)

If you are running Student-PA for yourself only, you can skip LiteLLM and directly set:

```env
OPENAI_API_KEY=sk-your-openai-key
OPENAI_BASE_URL=https://api.openai.com/v1
```

Then update `agent/config.yaml` to use your provider directly.

---

## Telegram Configuration

### Manual Bot Mode (No BotFather Automation)

If you don't want automatic bot creation:

1. Create one bot manually with @BotFather.
2. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ALLOWED_USERS` in `.env`.
3. The worker signup bot flow will be bypassed; you talk directly to the agent bot.

### Automatic Bot Mode (Full Multi-tenancy)

1. Get `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` from [my.telegram.org/apps](https://my.telegram.org/apps).
2. Set them in `.env` along with `TELEGRAM_PHONE`.
3. Run the worker Telethon authentication once:
   ```bash
   docker compose run --rm worker python auth_telethon.py
   ```
   If you already authenticated elsewhere and copied the session file to the server, you can skip this step. Make sure `.env`/compose points `TELEGRAM_SESSION` at the mounted in-container path, normally `/data/botfather_session`.
4. Set `SIGNUP_BOT_TOKEN` to a separate bot you create manually for onboarding.
5. Students use the signup bot, and the worker automatically creates their personal bot via BotFather.

### Operational Secrets

The Telethon session and generated agent runtime files are secrets, not disposable cache files:

- `./worker/sessions/*` contains the Telethon login session for the Telegram account that talks to BotFather. Anyone with that session may be able to act as that Telegram account.
- `./agents/{user_id}/secrets.json` contains generated bot tokens and LiteLLM keys. Treat nearby runtime files such as `agent.json` and `onboarding.json` as sensitive because they identify students and provisioning state.
- Back up these directories with encryption and access controls. Do not commit them, upload them to shared logs, or include them in support bundles without redaction.
- Rotate carefully: revoke leaked Telegram bot tokens in BotFather, revoke leaked LiteLLM keys in LiteLLM, and delete/recreate the Telethon session only after you are ready to re-authenticate the Telegram account.

---

## Google Workspace Setup

Agents can interact with Gmail, Calendar, Docs, and Sheets via the **GWS CLI**.

1. Enter an agent container:
   ```bash
   docker exec -it student-pa-agent bash
   ```

2. Authenticate:
   ```bash
   gws auth login
   ```

3. Follow the OAuth flow in your browser.

4. Verify:
   ```bash
   gws gmail +triage
   gws calendar +agenda
   ```

> **Note:** Google OAuth apps in testing mode are limited to 25 users. For a university deployment, you may need to submit your app for verification.

---

## Production Deployment

### Docker Compose (Single Host)

The included `docker-compose.yml` is suitable for small-to-medium deployments on a single Docker host.

```bash
# Use production env
cp .env.example .env
# Edit .env for production

docker compose -f docker-compose.yml up -d --build
```

### Reverse Proxy (Nginx / Traefik)

Place a reverse proxy in front of the web service:

```nginx
server {
    listen 443 ssl;
    server_name pa.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Cloud Deployment

For larger deployments, consider:

- **AWS / GCP / Azure**: Run worker and web on managed containers (ECS, Cloud Run, Azure Container Apps). Mount persistent storage for `./agents`.
- **Kubernetes**: A Helm chart is on the [roadmap](../README.md#roadmap). Contributions welcome!
- **Database**: Use a managed PostgreSQL instance instead of a containerized one.

### Secrets in Production

Never commit `.env` files. In production, use:

- **Docker Secrets** (Swarm mode)
- **Kubernetes Secrets**
- **AWS Secrets Manager / GCP Secret Manager / Azure Key Vault**
- **HashiCorp Vault**

Also include the Telethon session directory and per-agent runtime directories in your secret-handling policy. They should be backed up for recovery, but only in encrypted storage with the same care as API keys.

---

## Troubleshooting

### `host.docker.internal` does not resolve (Linux)

The `docker-compose.yml` includes `extra_hosts` for this. If your LiteLLM is on a different host, use the direct IP or public URL in `.env`.

### Hermes says "provider not configured"

Run the setup inside the agent container:

```bash
docker exec -it student-pa-agent hermes setup --non-interactive
```

Or verify that `LITELLM_API_BASE` and `LITELLM_API_KEY` are set in `.env`.

### Agent container fails to start

```bash
# Check worker logs
docker logs student-pa-worker

# Check if the agent image exists
docker images | grep student-pa-agent

# Rebuild manually
cd agent && docker build -t student-pa-agent:latest .
```

### LaTeX compilation fails

Install the missing package in `agent/Dockerfile`:

```dockerfile
RUN apk add --no-cache texmf-dist-<package-name>
```

### BotFather rate limiting

Telegram limits how fast you can create bots. If provisioning fails:

1. Wait a few minutes and use `/retry` in the signup bot.
2. Check worker logs for BotFather error messages.

### Cannot authenticate Telethon

Ensure your account has 2FA disabled or use an app password. Some carriers block Telegram SMS; use the code sent to your Telegram app instead.

---

## Next Steps

- Read [docs/ARCHITECTURE.md](ARCHITECTURE.md) to understand how the services interact.
- Read [CONTRIBUTING.md](../CONTRIBUTING.md) if you want to modify the code.
- Explore the [pre-built services](../agent/services/README.md) and create your own.
