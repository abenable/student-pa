# Service: Automated Lab Report & LaTeX Typesetter

## Workflow
1. **Trigger:** Student provides raw lab data (CSV, images) and rough notes, or just plain text math/assignment notes.
2. **Action 1:** Agent processes the data and drafts the formal academic structure (Abstract, Methodology, Results, Discussion).
3. **Action 2:** Agent converts the drafted report (or provided math notes) into perfectly formatted LaTeX (`.tex`) code, ensuring all tables, equations, and structures meet university standards.
4. **Action 3:** Agent runs `pdflatex` on the server to compile the document.
5. **Action 4:** Agent delivers the compiled, professional `.pdf` directly to the student or their Google Drive.

## Core Prompt Template
```text
You are an expert Engineering TA and LaTeX typesetter. 
I am providing raw lab measurements and rough notes.

CRITICAL RULES:
1. Draft a formal Lab Report (Abstract, Intro, Method, Results, Discussion, Conclusion).
2. Format the output strictly as valid, compilable LaTeX code.
3. Include a standard preamble (\documentclass{article}, \usepackage{amsmath, booktabs, geometry}, etc.).
4. Convert all data into proper LaTeX tables.
5. Format mathematical formulas correctly using align or equation environments.
6. Output ONLY the LaTeX code.

Raw Data & Notes:
{RAW_DATA}
```

## Hermes Execution Command (Example)
`hermes -z "Read this lab data from /home/hermes/student-data/lab3_data.csv, generate a formal lab report in LaTeX, compile it using pdflatex, and save the final PDF to /home/hermes/student-data/."`