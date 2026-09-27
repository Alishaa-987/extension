# AGENTS.md — rules for IBM Bob in this repo

## Product
Opportunity Rescue: users paste an opportunity (internship, fellowship, scholarship, hackathon, research, job)
from an official page. The app extracts the facts, shows urgency, and gives ONE concrete Next Action.
Core loop: Capture → Understand → Prioritize → Next Action → Rescue → Apply.

## Stack (do not change)
- React 18 + Vite 5, plain CSS (src/styles.css), no UI library
- State: React useState + localStorage (src/lib/storage.js). No backend, no auth.
- Tests: Node built-in test runner (`npm test`, files in tests/*.test.js)

## Architecture
- src/lib/extractor.js   → text → structured opportunity (pure functions)
- src/lib/nextAction.js  → daysLeft, urgency, nextAction, rescueScore, opportunityDebt (pure functions)
- src/lib/storage.js     → localStorage load/save (always wrapped in try/catch)
- src/data/samples.js    → demo data, deadlines relative to today
- src/components/*       → UI only; no business logic inside components

## Hard rules
1. NEVER invent facts. If the text doesn't state a deadline/organization/eligibility, return null and show "Not found".
2. A deadline is only accepted if the date sits in the same sentence as a deadline word (deadline, apply by, closes, due…).
3. Every change to src/lib must keep `npm test` green; add a test for new logic.
4. No social-media scraping, no URL fetching from the browser, no secrets in code.
5. Keep it simple: prefer editing existing files over adding new ones. No new dependencies without asking.
6. Urgency bands: critical 0–2 days · high 3–7 · medium 8–21 · low 22+ · unknown = no deadline.
