# AI Agent Agency: Student Services Portfolio

This is the finalized suite of 5 core services offered to university students, ranked in order of priority / daily utility.

> **How to run a service:**
> ```bash
> hermes -z "Read /app/services/<file>.md and execute the workflow."
> ```
>
> Or paste the **Core Prompt Template** directly into an interactive `hermes` chat session.

---

### 1. Workspace Automator (Inbox & Calendar Manager)
*   **What it does:** Reads unread Gmail, filters out spam, drafts replies to professors/recruiters, extracts deadlines, and automatically populates Google Calendar with reminders using the **GWS CLI**.
*   **Documentation:** `inbox_calendar_manager.md`

### 2. Automated Lab Report & LaTeX Typesetter
*   **What it does:** Takes raw CSV data and rough notes, drafts a formal lab report, converts it to valid `.tex` code, and compiles it into a PDF via `pdflatex`.
*   **Documentation:** `lab_report_latex_generator.md`

### 3. Internship & Job Application Engine
*   **What it does:** Scrapes job descriptions, drafts direct, tailored cover letters, and logs applications to a Google Sheet using the **GWS CLI**.
*   **Documentation:** `job_application_engine.md`

### 4. Academic Paper Interrogator
*   **What it does:** Extracts the Core Problem, Methodology, and Results from dense academic PDFs or arXiv links so students don't have to read 30 pages.
*   **Documentation:** `paper_interrogator.md`

### 5. Lecture & Video Summarizer
*   **What it does:** Extracts YouTube/audio transcripts and generates structured study guides saved to Google Docs via the **GWS CLI**.
*   **Documentation:** `lecture_summarizer.md`
