# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial open-source release with MIT license.
- Full documentation suite (README, SETUP, ARCHITECTURE, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT).
- GitHub issue and PR templates.

## [0.1.0] - 2026-06-02

### Added
- Multi-tenant agent provisioning via Telegram signup bot.
- Dockerized Hermes Agent template with 5 pre-built student services.
- Web dashboard built with TanStack Start, React 19, Tailwind CSS, and Better Auth.
- FastAPI worker for Telegram BotFather automation and LiteLLM key generation.
- Google Workspace CLI integration for Gmail, Calendar, Docs, and Sheets.
- LaTeX compilation support inside agent containers.
- Docker Compose orchestration for local development.
- One-line install script (`install.sh`) for single-student deployments.

### Security
- Containers run as non-root users with dropped capabilities.
- Per-student LiteLLM API keys with model restrictions.
- Secrets isolation via `.env` files and Docker secrets patterns.

[Unreleased]: https://github.com/abenable/student-pa/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/abenable/student-pa/releases/tag/v0.1.0
