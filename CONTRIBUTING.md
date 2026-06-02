# Contributing to Student-PA

First off, thank you for considering contributing to Student-PA! 🎓

Whether you're fixing a bug, adding a feature, improving docs, or sharing ideas, this guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Pull Requests](#pull-requests)
- [Style Guides](#style-guides)
  - [Git Commit Messages](#git-commit-messages)
  - [Python](#python)
  - [TypeScript / React](#typescript--react)
  - [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/student-pa.git
   cd student-pa
   ```
3. **Create a branch** for your work:
   ```bash
   git checkout -b feature/my-new-feature
   # or
   git checkout -b fix/bug-description
   ```
4. **Set up your development environment** (see below).

## Development Environment

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [Node.js](https://nodejs.org/) 24+ and [pnpm](https://pnpm.io/) (for the web app)
- [Python](https://www.python.org/) 3.11+ and [uv](https://docs.astral.sh/uv/) (for the worker)
- A [LiteLLM](https://docs.litellm.ai/) instance or OpenAI-compatible API key

### Quick Setup

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your local keys

# 2. Start core infrastructure
docker compose up -d --build

# 3. (Optional) Run web dev server outside Docker for hot reload
cd web
pnpm install
pnpm run dev

# 4. (Optional) Run worker in local Python environment
cd worker
uv pip install -r requirements.txt  # or pyproject.toml
uv run uvicorn main:api --reload --port 8000
```

For a complete setup guide, see [docs/SETUP.md](docs/SETUP.md).

## Project Structure

```
student-pa/
├── agent/          # Hermes Agent Dockerfile, config, and services
├── web/            # TanStack Start dashboard (React + Tailwind)
├── worker/         # FastAPI provisioner and Telegram signup bot
├── docs/           # Documentation
├── .github/        # GitHub Actions, issue templates
├── docker-compose.yml
├── install.sh      # Single-student standalone installer
└── README.md
```

## How to Contribute

### Reporting Bugs

Before creating a bug report, please:

1. Check the [existing issues](../../issues) to avoid duplicates.
2. Collect information about the bug (logs, environment, steps to reproduce).

Then, open a [Bug Report](../../issues/new?template=bug_report.md) and fill out the template.

### Suggesting Features

Feature requests are welcome! Please:

1. Check the [roadmap](../README.md#roadmap) and [existing issues](../../issues).
2. Open a [Feature Request](../../issues/new?template=feature_request.md) and describe:
   - The problem you're trying to solve
   - Your proposed solution
   - Alternatives you've considered

### Pull Requests

1. **Branch naming**:
   - `feature/description` for new features
   - `fix/description` for bug fixes
   - `docs/description` for documentation changes
   - `refactor/description` for code refactoring

2. **One logical change per PR**. If you have multiple unrelated changes, split them into separate PRs.

3. **Update documentation** if your change affects setup, usage, or architecture.

4. **Test your changes**:
   - For web: `pnpm run lint && pnpm run test`
   - For worker: run the FastAPI app and hit the health endpoint
   - For agent: build the Docker image and verify `hermes` runs

5. **Open the PR** with a clear title and description. Link any related issues using `Closes #123`.

6. **Wait for review**. Maintainers will review as soon as possible. Be open to feedback and willing to make changes.

## Style Guides

### Git Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting (no code change)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or correcting tests
- `chore`: Build process, dependencies, etc.

**Examples**:
```
feat(agent): add lecture transcript service for video summarization

fix(worker): handle BotFather rate-limiting during provisioning
docs(readme): update quick start instructions for macOS
```

### Python

- Follow [PEP 8](https://peps.python.org/pep-0008/).
- Use type hints where possible.
- Use `async`/`await` for I/O-bound operations.
- Keep functions focused and under 50 lines when practical.
- Use `logger` instead of `print` for diagnostics.

### TypeScript / React

- Follow the existing TanStack / React patterns in the codebase.
- Use functional components and hooks.
- Prefer explicit types over `any`.
- Use Tailwind CSS utility classes for styling.
- Run `pnpm run format` before committing.

### Documentation

- Use clear, concise language.
- Include code examples where helpful.
- Keep line lengths under 100 characters in markdown when possible.
- Update the table of contents if you add new sections.

## Community

- **Discussions**: For Q&A, ideas, and general chat, use [GitHub Discussions](../../discussions).
- **Issues**: For bug reports and feature requests only.
- **Security**: See [SECURITY.md](SECURITY.md) for vulnerability reporting.

Thank you for helping make Student-PA better for students everywhere! 🚀
