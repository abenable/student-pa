# Service: Group Assignment Compiler (The "Frankenstein" Fixer)

## Workflow
1. **Trigger:** The group leader (your user) provides a link to a messy Google Doc where 4 different students have pasted their individual sections, or uploads multiple separate files.
2. **Action 1:** Agent reads all the content.
3. **Action 2:** Agent unifies the tone so it sounds like one cohesive academic paper instead of four different people.
4. **Action 3:** Agent writes smooth transition paragraphs between sections.
5. **Action 4:** Agent generates an overarching Introduction and Conclusion based on the combined parts.
6. **Action 5:** Agent outputs the polished, final version to a new Google Doc.

## Core Prompt Template
```text
You are a strict academic editor. I am providing a draft of a group assignment written by multiple different people. It currently has inconsistent tones, overlapping points, and poor transitions.

Your task is to compile this into a single, cohesive, high-quality academic paper.

CRITICAL RULES:
1. **Unify the Tone:** Make the entire document sound formal, objective, and academic. Remove casual language.
2. **Transitions:** Add smooth transition sentences between different students' sections so it flows naturally.
3. **Synthesize:** Write a strong, overarching Introduction that outlines what the paper will cover, and a unifying Conclusion that summarizes all parts.
4. **Do NOT lose facts:** Keep all the core arguments, citations, and data. Just fix how they are written.

Draft Content:
{MESSY_DRAFT}
```

## Hermes Execution Command (Example)
`hermes run "Read this Google Doc containing our group project draft. Unify the tone, fix the transitions, write a final conclusion, and save the polished version to a new Doc named 'Final Submission'."`