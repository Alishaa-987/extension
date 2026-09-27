# IBM Bob session plan (do these in order, screenshot each task summary into bob_sessions/)

The judges want Bob as a CORE part of the build. Each task below is real work Bob does on this repo.
Save a screenshot of each task's summary as bob_sessions/01-plan.png, 02-....png, etc.

---
## 01 — Ask mode: understand the repo  (3 min)
> Read AGENTS.md, docs/ARCHITECTURE.md and the src/ folder. Explain the architecture, the data flow from
> pasted text to Next Action, and list any risks or bugs you see. Don't change any files.

## 02 — Plan mode: plan improvements  (3 min)
> I have ~60 minutes before the hackathon deadline. Following AGENTS.md, plan the 3 highest-impact
> improvements for demo quality and reliability: (1) more extractor test coverage, (2) a
> "Export deadline to calendar (.ics)" button on each card, (3) a UX/accessibility review.
> Don't write code yet; give me a step-by-step plan.

## 03 — Agent mode (use the opportunity-extractor skill): harden the extractor  (8 min)
> Using the opportunity-extractor skill, add tests in tests/logic.test.js for: "Deadline: 15th Oct",
> "Apply by Nov 3", text with two dates where only one is the deadline, text with no deadline,
> and a scholarship with no organization. Fix extractor.js if any test fails. Run `npm test` until green.

## 04 — Agent mode: new feature  (10 min)
> Add an "Add to calendar" button on OpportunityCard for opportunities with a deadline. It downloads an
> .ics file (all-day event on the deadline, plus a reminder 2 days before) generated in a new pure function
> src/lib/calendar.js with a test. No new dependencies. Run `npm test` and `npm run build`.

## 05 — Ask mode: judge-style review  (4 min)
> Review this app as a hackathon judge and senior frontend engineer. Is the main flow clear in 10 seconds?
> Is Next Action obvious? Any bugs, accessibility or mobile layout issues? Give the top 3 fixes, ranked.

## 06 — Agent mode: fix top issues  (8 min)
> Fix the top 3 issues from your review. Don't add new features. Run `npm test` and `npm run build`.

## 07 — Agent mode: deploy + README  (5 min)
> Make sure `npm run build` succeeds, then update README.md with setup steps and a
> "How IBM Bob was used" section listing tasks 01–07 and what each changed.

Optional if time is left: ask Bob to create a custom mode "Opportunity QA" that only runs tests and reviews.
