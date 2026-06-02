# Security Policy

## Supported Versions

The following versions of Student-PA are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in Student-PA, **please do not open a public issue**. Instead, we ask that you report it privately so we can address it responsibly.

### How to Report

1. **Email**: Send a detailed report to `security@student-pa.dev` (or contact the repository owner directly if this address is not yet active).
2. **Subject**: Use `[SECURITY] Brief description of the issue` as the subject line.
3. **Details**: Include the following in your report:
   - A clear description of the vulnerability.
   - Steps to reproduce the issue.
   - The potential impact (e.g., data exposure, unauthorized access).
   - Any suggested fixes or mitigations.
   - Your contact information for follow-up questions.

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours.
- **Investigation**: We will investigate and validate the issue within 7 days.
- **Resolution**: We aim to release a patch within 30 days for critical vulnerabilities.
- **Disclosure**: Once fixed, we will publicly disclose the issue (with credit to the reporter, if desired) and publish a security advisory.

## Security Best Practices for Deployers

When deploying Student-PA in production, please follow these guidelines:

1. **Secrets Management**: Never commit `.env` files or API keys to version control. Use Docker secrets, HashiCorp Vault, or your cloud provider's secret manager in production.
2. **Container Security**: The agent containers run as non-root with dropped capabilities. Do not modify Dockerfiles to run as root without a compelling reason.
3. **Network Isolation**: Place the LiteLLM gateway and database on private networks. Do not expose them to the public internet without authentication.
4. **Telegram Bot Security**: Keep bot tokens private. If a token is leaked, revoke it immediately via @BotFather and regenerate it.
5. **Regular Updates**: Keep base images (Docker, Node, Python) updated to patch known vulnerabilities.
6. **Monitoring**: Enable logging and monitoring for the worker and agent containers. Watch for unusual API usage patterns.

## Known Security Considerations

- **Multi-tenancy Isolation**: While each student gets their own container, they share the same Docker host. Ensure the host is hardened and only trusted users have Docker access.
- **LLM Data Exposure**: Student prompts and data are sent to your configured LLM provider. Ensure your LiteLLM gateway and upstream providers have appropriate data handling and privacy policies.
- **Google Workspace OAuth**: GWS CLI OAuth tokens are persisted on disk. Ensure the host filesystem is encrypted and access-controlled.

## Credits

We appreciate the security research community's efforts in helping keep Student-PA safe for students everywhere.
