# ⛑ Opportunity Rescue

**Don't just save opportunities. Rescue them before they disappear.**

Paste an internship, fellowship, scholarship or hackathon from its official page → get the real deadline
(never guessed), eligibility, skills and ONE concrete Next Action. A startup brief, Opportunity Debt and
Rescue Mode make sure saved opportunities turn into applications.

---

## Setup

**Prerequisites:** Node.js 18 or later.

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
# → http://localhost:5173

# 3. Run the test suite
npm test

# 4. Build for production
npm run build
# → output in dist/
```

No backend, no authentication, no external services. All data lives in your browser's `localStorage`.

---

## Features

- **Startup brief** — every session opens with a prioritised view of at-risk opportunities
- **Rule-based extraction** — deadline accepted only when a date sits in the same sentence as a deadline keyword; missing fields listed explicitly, never invented
- **Six urgency levels** — critical (0–2 days) · high (3–7) · medium (8–21) · low (22+) · unknown (no deadline) · expired
- **Next Action** — one concrete step per opportunity, derived from status + days remaining
- **One-click status progression** — "Mark as Reviewing →" advances the workflow
- **Opportunity Debt** — count of live opportunities with no meaningful action taken
- **Rescue Mode** — modal showing the top 3 at-risk opportunities
- **Add to Calendar** — downloads a `.ics` file (all-day event + 2-day reminder) for any opportunity with a deadline; works with Google Calendar, Apple Calendar, and Outlook
- **Data stays in the browser** — `localStorage` only, no server calls

---

## Architecture

```
src/
  lib/
    extractor.js    text → structured opportunity (pure functions, no invented facts)
    nextAction.js   daysLeft · urgency · nextAction · rescueScore · opportunityDebt
    storage.js      localStorage load / save / reset (always try/catch)
    calendar.js     generateICS — pure RFC 5545 iCalendar builder
  components/
    AnalyzePanel    paste + analyze modal
    OpportunityCard single opportunity card + status controls
    RescueMode      top-3 at-risk modal
    StartupBrief    session-open summary banner
    StatsBar        aggregate stats + Opportunity Debt widget
  data/
    samples.js      demo opportunities with relative deadlines
App.jsx             state wiring (useState + useEffect → localStorage)
```

All business logic lives in `src/lib/`. Components are display-only.

Tests: `tests/logic.test.js` · `tests/calendar.test.js` — run with `npm test` (Node built-in test runner, no extra packages).

---

## How IBM Bob was used

This project was built and hardened across seven IBM Bob sessions during a hackathon. Each session used a specific Bob mode and skill.

| # | Mode | Task | What changed |
|---|------|------|--------------|
| 01 | **Ask** | Architecture review | Read `AGENTS.md`, `src/lib/`, and all components. Produced a full data-flow diagram (pasted text → Next Action), identified 5 bugs and 7 risks including the `StatsBar` "Saved" label, `card-foot` overflow, and `extractDeadline` offset bug. No files changed. |
| 02 | **Plan** | Improvement planning | Created [`docs/improvements-plan.md`](docs/improvements-plan.md) with three sub-tasks: extractor test coverage, `.ics` calendar export, and UX/accessibility pass. Confirmed decisions: all-day event + 2-day VALARM, separate test files, no new npm dependencies. |
| 03 | **Agent** + opportunity-extractor skill | Extractor hardening | Added 5 new tests to [`tests/logic.test.js`](tests/logic.test.js): ordinal DMY date (`"Deadline: 15th Oct"`), `"Apply by Nov 3"`, two-date disambiguation, unlabelled date stays null, scholarship with no organisation. All 13 tests passed first run — no extractor changes needed. |
| 04 | **Agent** | Calendar export feature | Created [`src/lib/calendar.js`](src/lib/calendar.js) (`generateICS` — pure RFC 5545 builder with all-day event and `VALARM TRIGGER:-P2D`). Created [`tests/calendar.test.js`](tests/calendar.test.js) with 11 tests (DTSTART/DTEND, SUMMARY, UID, TRIGGER, DESCRIPTION, CRLF, month-end rollover, null guards). Added "📅 Add to calendar" button to [`OpportunityCard`](src/components/OpportunityCard.jsx) — only shown when a deadline is present. Build clean, 24/24 tests green. |
| 05 | **Ask** | Judge-style review | Reviewed the app as a hackathon judge. Found: (1) `card-foot` missing `flex-wrap` causes mobile overflow with three footer buttons; (2) action button label "Done → mark X" reads backwards; (3) no `aria-live` on NEXT ACTION updates; (4) Escape key does not close modals. No files changed. |
| 06 | **Agent** | Fix top 3 issues | Applied all four fixes: `flex-wrap: wrap` on `.card-foot` ([`styles.css`](src/styles.css)); button labels changed to `"Mark as X →"` in [`OpportunityCard`](src/components/OpportunityCard.jsx) and [`RescueMode`](src/components/RescueMode.jsx); `aria-live="polite"` added to `.next` div; `useEffect` Escape-key listeners added to [`AnalyzePanel`](src/components/AnalyzePanel.jsx) and [`RescueMode`](src/components/RescueMode.jsx). 24/24 tests, build clean. |
| 07 | **Agent** | Build verification + README | Confirmed `npm run build` produces a clean `dist/`. Updated this README with full setup instructions and this session log. |

---

## Data

Demo opportunities are fictional placeholders. No social-media data, no external URLs are fetched, no secrets are stored.
