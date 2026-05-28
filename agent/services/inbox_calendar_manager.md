# Service: Workspace Automator (Inbox & Calendar Manager)

## Workflow
1. **Trigger:** Can be run on-demand or set as a daily cronjob (e.g., every morning at 8 AM).
2. **Action 1 (Email Triage):** Agent uses `gws gmail triage` to fetch unread emails. It filters out spam/newsletters and highlights emails from professors, recruiters, or group members.
3. **Action 2 (Drafting):** For emails requiring a response, the agent drafts a contextual reply (e.g., acknowledging a deadline extension from a TA) and saves it as a draft.
4. **Action 3 (Calendar Sync):** Agent scans the email bodies for dates, times, or deadlines ("Assignment due Friday at 5 PM"). It automatically uses `gws calendar insert` to create events and set reminders.
5. **Action 4 (Notification):** Agent sends a concise "Daily Brief" to the user via Telegram, summarizing the important emails and confirming the new calendar events.

## Core Prompt Template
```text
You are an Executive Assistant managing a university student's inbox and calendar.
I will provide a list of unread emails.

CRITICAL RULES:
1. **Triage:** Ignore newsletters. Identify emails from university domains, professors, or job recruiters.
2. **Summarize:** Provide a 1-sentence summary of the important emails.
3. **Action Items:** Extract any deadlines, meeting times, or required tasks mentioned in the text.
4. **Drafts:** If an email asks a direct question (e.g., availability for a group meeting), write a short, polite draft reply.

Unread Emails:
{EMAIL_DATA}
```

## Hermes Execution Command (Example)
`hermes -z "Check my unread Gmail using gws. Summarize the important ones, draft a reply to my professor, and add the lab deadline mentioned in email #3 to my Google Calendar using gws calendar insert."`