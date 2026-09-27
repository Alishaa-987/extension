# Submission text (copy into lablab form)

**Title:** Opportunity Rescue

**Short description (≤ 255 chars):**
Don't just save opportunities — rescue them. Paste an internship or fellowship, get the real deadline, eligibility
and one concrete Next Action, plus Rescue Mode for what you saved but never acted on. Built with IBM Bob 2.0.

**Long description:**
Students and developers find internships, fellowships, scholarships and hackathons at the wrong moment, save the link
"for later", and forget until the deadline has passed. Bookmarks store links; they don't create follow-through.

Opportunity Rescue turns a saved opportunity into an action plan. Paste text from an official opportunity page and the
app extracts the title, organization, type, eligibility, skills, location and deadline — showing the exact sentence the
deadline came from and refusing to guess when none is stated. Each opportunity gets an urgency level and a single
concrete Next Action (check eligibility → tailor resume → finish questions → submit). A startup brief appears every time
you open the app, "Opportunity Debt" counts what you saved but never acted on, and Rescue Mode shows the three most
at-risk opportunities with one step each.

IBM Bob 2.0 was the core development partner: Ask mode for codebase understanding and judge-style reviews, Plan mode to
prioritize work under time pressure, and Agent mode with a custom `opportunity-extractor` skill and an AGENTS.md rulebook
to harden the extraction logic with tests, add calendar export and fix review findings. Session evidence is in
`bob_sessions/`.

Roadmap: Chrome extension "save this page" button, IBM Granite (watsonx.ai) summaries behind the same validated
interface, and email/push reminders.

**Tech tags:** IBM Bob, React, Vite, JavaScript

**Data note:** Demo data is fictional; users paste text from official opportunity pages. No social-media data is used.
