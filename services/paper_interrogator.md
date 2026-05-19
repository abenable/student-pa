# Service: Academic Paper Interrogator

## Workflow
1. **Trigger:** Student uploads a PDF or provides an arXiv link.
2. **Action 1:** Agent uses `arxiv` skill to fetch the paper metadata/abstract, or `read_file` to ingest the PDF text (via `pymupdf` or `marker-pdf`).
3. **Action 2:** Agent provides an initial executive summary.
4. **Action 3:** Student enters a conversational loop to ask specific questions ("What dataset did they use?", "Explain the methodology like I'm 5").

## Core Prompt Template (Initial Summary)
```text
You are an AI research assistant helping an engineering student quickly digest academic papers.
I have provided the text of an academic paper.

Please provide a "Skim Summary" formatted as follows:
- **The Core Problem:** What is the paper trying to solve?
- **The Proposed Solution / Methodology:** How did they solve it?
- **Key Findings / Results:** Did it work? Give the main metric.
- **Limitations:** What did they admit didn't work well?

Paper Text:
{PAPER_TEXT}
```

## Hermes Execution Command (Example)
`hermes -z "Fetch arXiv paper {ID}, give me a skim summary, and tell me what hardware they used for their experiments."`