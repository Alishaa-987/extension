# Opportunity Rescue — Hackathon Improvements Plan

## Overview

Three targeted improvements ordered by implementation risk (lowest first) within a ~60-minute window. All changes must stay within AGENTS.md constraints: no new dependencies, `npm test` must remain green, no business logic inside components, and no invented facts.

### Confirmed decisions
- ICS calendar event: all-day event on the deadline date, with a built-in VALARM reminder 2 days before. No extra user input required.
- New tests go in dedicated files: `tests/extractor.test.js` (extractor functions) and `tests/calendar.test.js` (ICS generator). `tests/logic.test.js` is left untouched.
- `npm test` runs `node --test tests/*.test.js` which already picks up all three files via glob — no `package.json` change needed.

---

## Sub-Task 1 — Extractor Test Coverage

**Status:** `[ ] pending`

### Intent
The existing test suite in `tests/logic.test.js` covers the happy path and a few edge cases, but several extractor branches documented in the architecture review have zero coverage. Adding these tests de-risks the live demo (a broken extractor is the most visible failure mode) and satisfies the AGENTS.md rule that every change to `src/lib` must be accompanied by a test.

New tests live in a new file `tests/extractor.test.js` so `tests/logic.test.js` is left exactly as is.

### Expected Outcomes
- `npm test` passes with zero failures across all three test files
- The following currently-untested paths are covered in `tests/extractor.test.js`:
  - `detectType` — each of the 7 categories (fellowship, internship, hackathon, scholarship, research, job, competition) matches correctly; text with no keywords returns `null`
  - `detectSkills` — matches a skill mid-sentence; does not false-positive on partial words (e.g. "CSS" must not match inside "access")
  - `detectOrganization` — label form (`Organization: X`) and "Company is hiring" form both extract correctly; missing org returns `null`
  - `detectLocation` — Remote/Online, Hybrid, On-site, label form, and fully missing all return correct values
  - `extractDeadline` — MDY with explicit year, DMY with explicit year, year-inference rollforward, date present but not labelled as a deadline

### Todo List
1. Create `tests/extractor.test.js` using the same import style and `TODAY = new Date(2026, 8, 27)` fixture as `tests/logic.test.js`.
2. Add `detectType` tests: one input per category + one null case.
3. Add `detectSkills` tests: mid-sentence match, no false-positive on "access" for "CSS", empty result for skill-free text.
4. Add `detectOrganization` tests: label form, hiring-sentence form, null return.
5. Add `detectLocation` tests: Remote keyword, Hybrid keyword, On-site keyword, label form, null return.
6. Add `extractDeadline` tests: MDY with year (`October 15, 2026`), DMY with year (`15 October 2026`), year-inferred rollforward (`Deadline: 5 Jan` when Jan has already passed), date present but not labelled.
7. Run `npm test` and confirm all tests in all three files pass.

### Relevant Context
- `tests/logic.test.js` — do not modify; use as style reference only
- `src/lib/extractor.js` — `detectType`, `detectSkills`, `detectOrganization`, `detectLocation`, `extractDeadline` are all named exports
- Known risk: `intern ` trailing-space keyword in `detectType` and the `indexOf`-offset issue in `extractDeadline` — tests may surface these as failures to fix

---

## Sub-Task 2 — Export Deadline to Calendar (.ics) Button

**Status:** `[ ] pending`

### Intent
A single-click "Add to Calendar" button on each `OpportunityCard` lets the user export the deadline as a `.ics` file compatible with Google Calendar, Apple Calendar, and Outlook. Zero network calls (pure data URI), zero new npm dependencies. The 2-day reminder alarm is baked in automatically — no user input required.

### Expected Outcomes
- Each card with a non-null deadline shows a small "📅 Add to Calendar" button in the card footer alongside the existing "Open page ↗" link
- Clicking downloads a valid `.ics` file; the filename is derived from the opportunity title
- Cards with no deadline do not show the button
- The `.ics` event is an all-day event on the deadline date, with `SUMMARY` = title, `DESCRIPTION` = URL (if present), `UID` = `opp.id`, and a `VALARM` that triggers 2 days (P2D) before the event
- The ICS generation function lives in `src/lib/ics.js` as a pure exported function — no side-effects, no DOM
- A dedicated test file `tests/calendar.test.js` verifies the pure function output

### Todo List
1. Create `src/lib/ics.js` with a single exported function `generateICS(opp)`. Build the iCalendar string with these fields:
   - `BEGIN:VCALENDAR` / `VERSION:2.0` / `PRODID`
   - `BEGIN:VEVENT`
   - `UID`: use `opp.id`
   - `DTSTAMP`: current UTC datetime in `YYYYMMDDTHHmmssZ` format
   - `DTSTART;VALUE=DATE`: deadline as `YYYYMMDD`
   - `DTEND;VALUE=DATE`: deadline + 1 day as `YYYYMMDD` (iCal all-day convention)
   - `SUMMARY`: `opp.title`
   - `DESCRIPTION`: `opp.url` if present, otherwise omit the line
   - `BEGIN:VALARM` / `TRIGGER:-P2D` / `ACTION:DISPLAY` / `DESCRIPTION:Reminder` / `END:VALARM`
   - `END:VEVENT` / `END:VCALENDAR`
   - All lines must end with `\r\n` per RFC 5545
2. Create `tests/calendar.test.js`. Import `generateICS` and assert:
   - Output contains `DTSTART;VALUE=DATE:20261015` for a deadline of `2026-10-15`
   - Output contains `DTEND;VALUE=DATE:20261016` (day after)
   - Output contains `SUMMARY:Open Source Fellowship`
   - Output contains `UID:sample_1`
   - Output contains `TRIGGER:-P2D`
   - A null deadline input returns `null` (the function must guard against it)
3. In `src/components/OpportunityCard.jsx`:
   - Import `generateICS` from `../lib/ics.js`
   - Add a local `downloadICS(opp)` function that encodes the result as a `data:text/calendar;charset=utf-8,...` URI and triggers download via a temporary `<a>` element — this is a UI handler, not business logic
   - In the `card-foot` div (after the "Open page ↗" link), render `{opp.deadline && <button className="btn small ghost" onClick={() => downloadICS(opp)}>📅 Add to Calendar</button>}`
4. Run `npm test` — all three test files must pass.
5. Manually download a `.ics` from a card and verify it opens correctly in a calendar app or paste into an online iCal validator.

### Relevant Context
- `src/components/OpportunityCard.jsx` lines 65-78 — `card-foot` div is where the button is added
- `src/styles.css` — `.btn.small.ghost` already styles the "Open page ↗" link; reuse the same class
- `src/lib/` — new pure function goes here per AGENTS.md
- iCalendar all-day convention: `DTSTART;VALUE=DATE` (no time component); `DTEND` = start + 1 calendar day
- `VALARM` trigger for 2 days before: `TRIGGER:-P2D`
- RFC 5545 line ending: every line must end with `\r\n`, not `\n`

---

## Sub-Task 3 — UX / Accessibility Review and Fixes

**Status:** `[ ] pending`

### Intent
A quick accessibility pass ensures the app works for keyboard and screen-reader users during the demo and addresses the most visible UX rough edges identified in the architecture review. Changes are CSS or JSX-attribute level only — no logic changes, no new dependencies.

### Expected Outcomes
- All interactive elements are reachable and operable by keyboard alone
- Screen readers announce urgency and status meaningfully
- The `StatsBar` "Saved" label is corrected to "Total" (it currently shows `opps.length` which includes applied/rejected items — identified as risk R7 in the architecture review)
- `aria-label` is present and descriptive on all icon-only buttons
- Modal overlays prevent interaction with background content while open
- `npm test` still passes (no logic touched)

### Todo List
1. In `src/components/StatsBar.jsx` line 8: change the label `"Saved"` to `"Total"` to accurately reflect `opps.length`.
2. In `src/components/AnalyzePanel.jsx`: confirm the `×` close button has `aria-label="Close"` (it does at line 46) — upgrade to `aria-label="Close dialog"` for more descriptive screen-reader output.
3. In `src/components/RescueMode.jsx`: same — upgrade `aria-label="Close"` on the close button (line 19) to `aria-label="Close dialog"`.
4. In `src/styles.css`: check whether `.overlay` already sets `pointer-events` correctly and whether the modal has enough contrast for urgency pills. If `.overlay` does not prevent tab-focus from reaching the background, add `isolation: isolate` and note the remaining JS focus-trap gap as a known limitation (full JS trap is out of scope for 60 min).
5. Audit tab order on `OpportunityCard`: `select` → action button → "Open page" link → (new) calendar button must all be focusable in visual reading order. Adjust `tabIndex` only if order is broken.
6. Do a keyboard-only walkthrough: open AnalyzePanel with Tab+Enter, navigate fields, close with Escape or `×`; repeat for RescueMode.

### Relevant Context
- `src/components/StatsBar.jsx` line 8 — `"Saved"` label (risk R7 from architecture review)
- `src/components/AnalyzePanel.jsx` line 46 — close button `aria-label`
- `src/components/RescueMode.jsx` line 19 — close button `aria-label`
- Both modals already have `role="dialog"` and `aria-label` on the container — foundation is solid
- No new dependencies: AGENTS.md forbids adding libraries without asking

---

## Execution Order

Sub-Tasks run in order 1 → 2 → 3. Sub-Task 1 is pure logic with no UI risk; Sub-Task 2 adds the new feature; Sub-Task 3 is cosmetic/attribute-level and is done last so no earlier changes need re-auditing.
