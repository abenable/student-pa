# Service: Internship & Job Application Engine

## Workflow
1. **Trigger:** Student provides a link to a job/internship posting.
2. **Action 1:** Agent scrapes the job description (using web tools/curl).
3. **Action 2:** Agent reads the student's base resume (stored locally or on G-Drive).
4. **Action 3:** Agent drafts a highly targeted cover letter.
5. **Action 4:** Agent appends a new row to the student's "Internship Tracker" Google Sheet using `gws sheets append`.

## Core Prompt Template (Tailored to your style)
```text
You are a career assistant. Write a cover letter for the following job description using my resume.

CRITICAL RULES:
- Keep the introduction extremely direct. No fluff.
- State my current academic status immediately in the first paragraph (e.g., "I am a 3rd-year Electrical Engineering student at Makerere University...").
- Do NOT pad the opening with generic summaries of my skills.
- Map exactly 2-3 of my resume experiences to the core requirements in the JD.
- Keep it under 300 words.

Job Description: {JD_TEXT}
Resume: {RESUME_TEXT}
```

## Hermes Execution Command (Example)
`hermes -z "Read this job posting {URL}, draft a direct cover letter using my resume at /home/hermes/student-data/Resume.pdf, save it to a Google Doc with gws docs, and log the application in my Tracker Sheet with gws sheets append."`