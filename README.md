# Student Personal Assistant (Student-PA)

**Open-source AI agent platform for university students.**

Student-PA gives every student their own personal AI agent — accessible via Telegram — that helps with scheduling, academic writing, research, job applications, and more. Each student gets an isolated, containerized [Hermes Agent](https://hermes-agent.nousresearch.com/) instance with pre-built workflows and secure API-key management.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Docker](https://img.shields.io/badge/built%20with-Docker-blue)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/python-3.11%2B-blue)](https://www.python.org/)
[![Node](https://img.shields.io/badge/node-24%2B-green)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## Table of Contents

- [Features](#features)
- [Screenshots & Demo](#screenshots--demo)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Features

### For Students
- **Personal AI Agent** — Each student gets a dedicated Telegram bot and isolated Docker container.
- **5 Pre-built Services** — Ready-to-use academic workflows:
  1. **Inbox & Calendar Manager** — Read Gmail, draft replies, extract deadlines, populate Google Calendar.
  2. **Lab Report LaTeX Typesetter** — Convert raw notes and CSV data into compiled PDF lab reports.
  3. **Job Application Engine** — Scrape job descriptions, draft tailored cover letters, log to Google Sheets.
  4. **Academic Paper Interrogator** — Extract core problem, methodology, and results from dense PDFs.
  5. **Lecture & Video Summarizer** — Generate structured study guides from YouTube transcripts.
- **Telegram Gateway** — Chat with your agent anywhere, anytime.
- **Google Workspace Integration** — Native Gmail, Calendar, Docs, and Sheets support via GWS CLI.

### For Admins / Deployers
- **Multi-tenant by Design** — One signup bot provisions isolated agent containers per student.
- **Secure API Key Management** — Per-student LiteLLM keys with model restrictions and metadata tracking.
- **Automatic Bot Creation** — Integrates with Telegram BotFather to spin up bots automatically.
- **Web Dashboard** — TanStack Start-based admin dashboard with Better Auth and Prisma.
- **Docker-first** — Everything runs in containers with dropped capabilities and non-root users.

---

## Screenshots & Demo

> Coming soon! We are working on a public demo video and screenshot gallery. See [Issue #1](../../issues/1) if you'd like to help.

---

## Quick Start

The fastest way to try Student-PA locally with Docker:

```bash
# 1. Clone the repository
git clone https://github.com/abenable/student-pa.git
cd student-pa

# 2. Configure environment
cp .env.example .env
# Edit .env and fill in your keys (see docs/SETUP.md for details)

# 3. Build and start all services
docker compose up -d --build

# 4. Check that everything is running
docker compose ps
```

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- A [LiteLLM](https://docs.litellm.ai/) instance or OpenAI-compatible API endpoint
- A Telegram bot token from [@BotFather](https://t.me/botfather)
- (Optional) Telegram API ID / Hash from [my.telegram.org](https://my.telegram.org/apps) for automatic bot provisioning

For detailed setup instructions (including production deployment, SSL, and cloud hosting), see **[docs/SETUP.md](docs/SETUP.md)**.

---

## Architecture

Student-PA is a multi-service platform composed of three main components:

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

For a deep dive into how the pieces fit together, see **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/SETUP.md](docs/SETUP.md) | Complete installation and configuration guide |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, data flow, and security model |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute code, report bugs, and propose features |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards and expected behavior |
| [SECURITY.md](SECURITY.md) | Security policy and vulnerability reporting |

Additional service-level docs:
- [Agent Services](agent/services/README.md) — The 5 pre-built student workflow templates.
- [Web App](web/README.md) — TanStack Start web dashboard specifics.

---

## Roadmap

- [ ] Public demo instance with video walkthrough
- [ ] OAuth2 login support (Google, GitHub) in web dashboard
- [ ] Plugin system for custom student services
- [ ] Support for additional messaging platforms (WhatsApp, Discord)
- [ ] Kubernetes Helm chart for production deployments
- [ ] Automated CI/CD for multi-arch Docker images
- [ ] Multi-language support (i18n)

See [open issues](../../issues) and [discussions](../../discussions) for feature requests and ideas.

---

## Contributing

We welcome contributions from students, developers, and educators! Whether it's fixing a typo, adding a new service, or improving documentation, every contribution matters.

- Read our **[Contributing Guide](CONTRIBUTING.md)** to get started.
- Check out **[good first issues](../../issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)**.
- Join the conversation in **[Discussions](../../discussions)**.

Please note that this project follows a **[Code of Conduct](CODE_OF_CONDUCT.md)**. By participating, you agree to uphold it.

---

## Security

Security is a priority for Student-PA because we handle student data and API keys.

- Containers run as non-root users with minimal capabilities.
- API keys are never committed to the repository (see `.gitignore`).
- Each student receives an isolated Docker container and a unique LiteLLM API key.

If you discover a security vulnerability, please **do not** open a public issue. Instead, follow the instructions in **[SECURITY.md](SECURITY.md)** to report it responsibly.

---

## License

Student-PA is licensed under the [GNU Affero General Public License v3.0 (AGPLv3)](LICENSE).

This means that if you run a modified version of this software on a network server, you must make the source code available to the users of that server. See the [LICENSE](LICENSE) file for full details.

---

## Acknowledgments

- Built on top of [Hermes Agent](https://hermes-agent.nousresearch.com/) by Nous Research.
- Google Workspace integration powered by [GWS CLI](https://github.com/googleworkspace/google-workspace-cli).
- UI built with [TanStack](https://tanstack.com/), [Tailwind CSS](https://tailwindcss.com/), and [shadcn/ui](https://ui.shadcn.com/).

---

<p align="center">
  Made with ❤️ for students everywhere.<br>
  <a href="https://github.com/abenable/student-pa">Star us on GitHub</a> if you find this useful!
</p>
