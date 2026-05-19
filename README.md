# Student Personal Assistant (Student-PA)

This repository contains the Docker scaffold and Out-of-the-Box services to deploy a Managed Hermes Agent for university students. 

## Architecture
- **Agent Engine:** Hermes
- **LLM Gateway:** Self-hosted LiteLLM (for API key management and token billing)
- **Integrations:** GWS CLI (Google Workspace) + pdflatex + marker-pdf

## Getting Started

1. **Configure Environment:**
   Set your LiteLLM URL and API key in a `.env` file (or directly in `docker-compose.yml`):
   ```bash
   LITELLM_API_BASE=http://your-coolify-litellm.com
   LITELLM_API_KEY=sk-xxxxxx
   ```

2. **Build and Start the Container:**
   ```bash
   docker-compose up -d --build
   ```

3. **Authenticate GWS CLI:**
   You need to authenticate the Google Workspace CLI once per student. The credentials will be saved in the `./gws-auth` volume.
   ```bash
   docker exec -it student-pa-agent bash
   gws auth login
   ```

4. **Run a Service:**
   The out-of-the-box services are located in the `/app/services` directory inside the container. To execute one:
   ```bash
   docker exec -it student-pa-agent hermes run "Read /app/services/inbox_calendar_manager.md and execute the workflow on my unread emails."
   ```

## Out of the Box Services Included (`/services/`):
1. `inbox_calendar_manager.md`
2. `lab_report_latex_generator.md`
3. `job_application_engine.md`
4. `paper_interrogator.md`
5. `lecture_summarizer.md`