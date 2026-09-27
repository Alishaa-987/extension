---
name: opportunity-extractor
description: Use when changing or testing how Opportunity Rescue extracts facts (title, deadline, type, eligibility, skills) from pasted opportunity text.
---

# Opportunity Extractor

When working on src/lib/extractor.js or its tests:

1. Extract only what the source text supports. Missing → `null` (or `[]` for lists). Never guess.
2. Deadline: accept a date only if it is in the same sentence as a deadline keyword
   (deadline, apply by, applications close, closing date, last date, due, submit by, register by).
   Dates without a keyword → deadline `null` + a note telling the user to check the official page.
3. If the year is missing, use the next future occurrence and set a note "Year not stated".
4. Supported date formats: `2026-10-15`, `October 15, 2026`, `Oct 15`, `15 October 2026`, `15th Oct`.
5. Type: one of fellowship, internship, hackathon, scholarship, research, job, competition — or `null`.
6. Keep the summary ≤ 220 characters and exclude deadline sentences.
7. Return a `missing` array listing every field that was not found.
8. For every new rule, add a test in tests/logic.test.js covering: complete text, missing deadline,
   unlabelled date, and ambiguous input. Run `npm test` before finishing.
