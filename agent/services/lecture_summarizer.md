# Service: Lecture & Video Summarizer

## Workflow
1. **Trigger:** Student sends a YouTube link.
2. **Action 1:** Agent uses the `youtube-content` skill (or `yt-dlp` for raw transcripts) to extract the video transcript.
3. **Action 2:** Agent processes the transcript into a structured study guide.
4. **Action 3:** Agent uses `gws docs` to create a new Google Doc and saves the summary to the student's Drive.

## Core Prompt Template
```text
You are an academic assistant. I will provide a transcript of a university lecture or tutorial.
Your task is to create a structured study guide.

Format the output with:
1. **High-Level Summary:** (2-3 sentences)
2. **Core Concepts:** (Bullet points of main ideas)
3. **Important Definitions/Formulas:** (Extract any clear definitions or math/code snippets)
4. **Potential Exam Questions:** (Generate 3-5 questions based on the material to test understanding)

Transcript:
{TRANSCRIPT_DATA}
```

## Hermes Execution Command (Example)
`hermes -z "Get the transcript for {URL} using yt-dlp, summarize it into a study guide, and save it as a new Google Doc named 'Study Guide: {Video Title}' using gws docs."`