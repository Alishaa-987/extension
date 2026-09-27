# Opportunity Rescue

**Don't just save opportunities. Rescue them before they disappear.**

Paste an opportunity from its official page — internship, fellowship, scholarship, hackathon, research programme, or job — and get the real deadline (never guessed), eligibility requirements, required skills, and ONE concrete Next Action. A startup brief, Opportunity Debt tracker, and Rescue Mode make sure saved opportunities turn into applications before they expire.

Available as a **web app** (runs locally or deployed) and a **Chrome/Edge browser extension** (paste a URL, scrape the page, save instantly).

---

## Table of Contents

1. [Web App — Setup](#web-app--setup)
2. [Web App — Features](#web-app--features)
3. [Browser Extension — Setup](#browser-extension--setup)
4. [Browser Extension — Features](#browser-extension--features)
5. [Architecture](#architecture)
6. [How IBM Bob was used](#how-ibm-bob-was-used)

---

## Web App — Setup

**Prerequisites:** Node.js 18 or later.

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
# Open http://localhost:5173

# 3. Run the test suite (24 tests, no extra packages)
npm test

# 4. Production build
npm run build
# Output in dist/ — drag this folder to Netlify or Vercel to deploy
```

No backend, no authentication, no external services. All data lives in your browser's `localStorage`.

---

## Web App — Features

### Core extraction
- **Rule-based extractor** — parses pasted text using regex, never calls an AI API or external service
- **Deadline rule** — a date is only accepted as a deadline if it appears in the **same sentence** as a deadline keyword (`deadline`, `apply by`, `applications close`, `closing date`, `due by`, `submit by`, `register by`, etc.). Dates without a keyword are flagged, never silently accepted.
- **Year inference** — if no year is stated (e.g. "Deadline: Jan 5"), the next future occurrence is assumed and a note is shown
- **Missing fields** — every field that could not be found is listed explicitly as "Not found". Nothing is invented.
- **Editable before saving** — every extracted field is shown in an editable form so you can correct mistakes before saving

### Urgency system
| Band | Days to deadline |
|------|-----------------|
| 🔴 Critical | 0 – 2 days |
| 🟠 High | 3 – 7 days |
| 🟡 Medium | 8 – 21 days |
| 🟢 Low | 22+ days |
| 🟣 Unknown | No deadline found |
| ⚫ Expired | Deadline passed |
| ✅ Done | Applied / Accepted / Rejected |

### Workflow
- **Startup brief** — every time you open the app, a banner shows your top at-risk opportunities and how many expire this week
- **Next Action** — one concrete step derived from status + days left (e.g. "Check eligibility", "Tailor your resume for React, Python", "Submit the application today")
- **Status progression** — six statuses: Saved → Reviewing → Started → Applied → Accepted / Rejected. One-click "Mark as X →" button advances the workflow.
- **Opportunity Debt** — counts how many live opportunities have had no meaningful action (still Saved or Reviewing)
- **Rescue Mode** — modal showing the top 3 highest-risk opportunities with one-step actions
- **Filter tabs** — Needs attention · Upcoming · Applied · Expired · All, each showing live counts

### Calendar export
- **Add to Calendar button** — appears on every card that has a deadline
- Downloads a `.ics` file: all-day event on the deadline date, with an automatic **2-day-before reminder alarm**
- Works with Google Calendar, Apple Calendar, Outlook, and any standard calendar app
- Generated entirely client-side — pure RFC 5545 iCalendar string, no server involved

### Data & privacy
- All data stored in `localStorage` under key `opportunity-rescue:v1`
- No account, no sync, no analytics, no network calls
- Demo data uses fictional organisations and relative deadlines — always looks current

---

## Browser Extension — Setup

The extension works in **Chrome and Edge** (both use the same Chromium extension API — no changes needed between them).

### Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (toggle, top-right corner)
3. Click **"Load unpacked"**
4. Select the `extension\` folder inside this project:
   ```
   E:\opportunity-rescue\extension
   ```
5. The ⛑ icon appears in the toolbar. Pin it via the 🧩 puzzle-piece menu.

### Load in Edge

1. Open `edge://extensions`
2. Enable **Developer mode** (toggle in the **left sidebar**, near the bottom)
3. Click **"Load unpacked"**
4. Select the same `extension\` folder
5. Pin the icon via the 🧩 Extensions menu in the toolbar

### After any code change

Go to `chrome://extensions` or `edge://extensions` → find the Opportunity Rescue card → click the **↺ refresh icon**.

---

## Browser Extension — Features

### Popup (click the ⛑ toolbar icon)

```
┌─────────────────────────────────────────┐
│ ⛑  Opportunity Rescue    [📋 View all] │
│─────────────────────────────────────────│
│  Opportunity URL                        │
│  [ https://...                        ] │
│                                         │
│  [ Fetch & Analyze ]                    │
└─────────────────────────────────────────┘
```

- **"📋 View all" button** — visible on every screen (input, result, saved confirmation). Opens the full dashboard in a new tab.
- **URL fetch** — paste any opportunity URL and click "Fetch & Analyze". The background service worker fetches the page, strips HTML to readable text, and runs the same extractor as the web app. No CORS restrictions because the fetch happens in the service worker.
- **Editable result** — all extracted fields (title, org, type, deadline, location, eligibility, skills, summary) are shown in an editable form before saving. Next Action is previewed live.
- **Save** — stores the opportunity in `chrome.storage.local` under `opportunity-rescue:v1`
- **"Add another"** — confirmation screen lets you immediately add another opportunity without reopening the popup

### Dashboard (📋 View all)

Opens as a full browser tab — a complete opportunity manager:

- **All saved opportunities** displayed as urgency-coloured cards (same colour coding as the web app)
- **Stats bar** — Total saved · Applied · Expiring this week · Expired
- **Filter** — All / Needs attention / Upcoming / Applied / Expired
- **Each card shows:**
  - Urgency pill (Critical / High / Medium / Low / No deadline / Expired / Done)
  - Type pill (fellowship / internship / hackathon / etc.)
  - Deadline countdown ("2 days left", "Due today", "Closed 3 days ago")
  - Summary text and skill chips
  - **NEXT ACTION** box with one-click "Mark as X →" status advancement
  - Status dropdown for manual override
  - "Open page ↗" link to the original URL
  - **× Delete button** — removes the card and updates storage instantly
- **Live updates** — if you add a new opportunity in the popup while the dashboard tab is open, the dashboard automatically refreshes via `chrome.storage.onChanged`
- **"+ Add opportunity"** button — opens the popup page in a new tab

### Deadline notifications

When you open your laptop and Chrome/Edge starts:

- The background service worker fires immediately on `chrome.runtime.onStartup`
- It checks all saved opportunities for deadlines **within the next 7 days** (excluding already applied/accepted/rejected)
- If any are found, a **system notification** appears:

```
⛑ 2 opportunities need attention
• Open Source Fellowship (due in 2 days)
• Frontend Internship (due tomorrow)
```

- The check also runs **every hour** automatically via `chrome.alarms` — so if you leave the browser open all day you get a reminder
- First time: Chrome/Edge may ask permission to show notifications — click **Allow**

### Dark mode

Both popup and dashboard automatically follow your OS/browser dark mode setting (`prefers-color-scheme: dark`). No manual toggle needed.

### Storage

The extension uses `chrome.storage.local` with the same key (`opportunity-rescue:v1`) as the web app's `localStorage`. The two stores are **separate** (browser extension storage vs. web page storage), but the data format is identical.

---

## Architecture

### Web app (`src/`)

```
src/
  lib/
    extractor.js      text → structured opportunity
                      (detectTitle, extractDeadline, detectType, detectSkills,
                       detectEligibility, detectLocation, detectOrganization,
                       summarize, analyzeOpportunity)
    nextAction.js     daysLeft · urgency · nextAction · rescueScore ·
                      opportunityDebt · rescueList · isExpired
    storage.js        localStorage load / save / reset (always try/catch)
    calendar.js       generateICS — pure RFC 5545 iCalendar builder
                      (all-day event, VALARM TRIGGER:-P2D)
  components/
    AnalyzePanel      paste + analyze modal (Escape key closes)
    OpportunityCard   single card + status controls + calendar download
    RescueMode        top-3 at-risk modal (Escape key closes)
    StartupBrief      session-open summary banner
    StatsBar          aggregate stats + Opportunity Debt widget
  data/
    samples.js        demo opportunities with relative deadlines
App.jsx               state wiring (useState + useEffect → localStorage)
styles.css            plain CSS, CSS custom properties, dark mode media query
```

### Browser extension (`extension/`)

```
extension/
  manifest.json       Chrome/Edge MV3 manifest
                      permissions: storage, tabs, notifications, alarms
                      host_permissions: <all_urls>
  background.js       service worker
                      - URL fetch + HTML-to-text + analyzeOpportunity
                      - chrome.storage CRUD (save, update status, delete, load all)
                      - deadline notifications via chrome.alarms (hourly) +
                        chrome.runtime.onStartup
  extractor.js        plain-script port of src/lib/extractor.js (no ES module syntax)
  nextAction.js       plain-script port of src/lib/nextAction.js
  popup.html/css/js   toolbar popup — URL input, result review, save confirmation
                      "View all" button always visible in header
  dashboard.html/css/js  full-tab opportunity dashboard — cards, filters, stats,
                         delete, status updates, live storage sync
  icon16.png          toolbar icon (16x16, generated PNG)
  icon48.png          extension card icon (48x48, generated PNG)
  icon128.png         store icon (128x128, generated PNG)
```

### Tests

```
tests/
  logic.test.js       18 tests — extractor + nextAction + opportunityDebt
  calendar.test.js    11 tests — generateICS (DTSTART, DTEND, VALARM, CRLF,
                                 month-end rollover, null guards)
```

Run with `npm test` — Node.js built-in test runner, zero extra packages.

---

## How IBM Bob was used

This project was built and hardened across multiple IBM Bob sessions. Each session used a specific mode and skill.

| # | Mode | Task | What changed |
|---|------|------|--------------|
| 01 | **Ask** | Architecture review | Read `AGENTS.md`, all `src/lib/` files, and all components. Produced full data-flow analysis (pasted text → Next Action), identified 5 bugs and 7 risks including `card-foot` overflow, backwards button labels, and `extractDeadline` offset bug. No files changed. |
| 02 | **Plan** | Improvement planning | Created [`docs/improvements-plan.md`](docs/improvements-plan.md) with three sub-tasks: extractor test coverage, `.ics` calendar export, UX/accessibility pass. Confirmed: all-day event + 2-day VALARM, separate test files, no new npm dependencies. |
| 03 | **Agent** + opportunity-extractor skill | Extractor hardening | Added 5 tests to [`tests/logic.test.js`](tests/logic.test.js): ordinal DMY (`"Deadline: 15th Oct"`), `"Apply by Nov 3"`, two-date disambiguation, unlabelled date stays null, scholarship with no organisation. 13/13 green, no extractor changes needed. |
| 04 | **Agent** | Calendar export | Created [`src/lib/calendar.js`](src/lib/calendar.js) + [`tests/calendar.test.js`](tests/calendar.test.js) (11 tests). Added "Add to calendar" button to [`OpportunityCard`](src/components/OpportunityCard.jsx). 24/24 tests, build clean. |
| 05 | **Ask** | Judge-style review | Identified: `card-foot` mobile overflow, backwards action button label, no `aria-live` on Next Action, no Escape-key close on modals. |
| 06 | **Agent** | Fix top issues | `flex-wrap` on `.card-foot`; labels changed to `"Mark as X →"`; `aria-live="polite"` on Next Action div; `useEffect` Escape listeners in `AnalyzePanel` and `RescueMode`. 24/24 tests, build clean. |
| 07 | **Agent** | README | Updated README with setup steps and session log. |
| 08 | **Agent** | Chrome extension | Built complete `extension/` folder: `manifest.json`, `background.js` (fetch + extract + storage), `popup.html/css/js`, `extractor.js` + `nextAction.js` (plain-script ports), icon PNGs. |
| 09 | **Agent** | Extension dashboard | Added `dashboard.html/css/js` — full opportunity list with urgency cards, stats bar, filters, status updates, delete, live storage sync. Fixed `dashboard.js` to read `chrome.storage.local` directly (service worker sleep bug). |
| 10 | **Agent** | Extension polish | Moved "View all" button to header (visible on all popup screens). Added deadline notifications via `chrome.alarms` + `chrome.runtime.onStartup`. Added dark mode (`prefers-color-scheme`) to popup and dashboard. Generated proper PNG icons (16/48/128px). Fixed corrupted `manifest.json` description that was preventing Edge from loading the extension. |

---

## Data & Privacy

- Demo opportunities use fictional organisation names. No real scraped data is included in the source.
- The web app makes zero network calls from the browser.
- The extension fetches only the URL you explicitly paste — no background browsing, no tracking.
- No analytics, no telemetry, no accounts, no secrets in code.
