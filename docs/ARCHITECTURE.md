# Architecture

```
            User pastes text from an official opportunity page (+ optional link)
                                   │
                                   ▼
                 ┌──────────────────────────────────┐
                 │  extractor.js  (rule-based)       │
                 │  title · org · type · deadline    │
                 │  eligibility · skills · location  │
                 │  summary · missing[]              │
                 └──────────────────────────────────┘
                                   │  user reviews / edits
                                   ▼
                 ┌──────────────────────────────────┐
                 │  localStorage (storage.js)        │
                 └──────────────────────────────────┘
                                   │
                                   ▼
                 ┌──────────────────────────────────┐
                 │  nextAction.js                    │
                 │  daysLeft → urgency → nextAction  │
                 │  rescueScore → Rescue list        │
                 │  opportunityDebt                  │
                 └──────────────────────────────────┘
                                   │
          ┌────────────────┬───────┴────────┬────────────────┐
          ▼                ▼                ▼                ▼
    Startup Brief     Stats + Debt     Opportunity cards   Rescue Mode
   (on every open)                    (filter by urgency)  (top 3 at risk)
```

## Data model
```js
{
  id, title, organization, type,          // type: fellowship|internship|hackathon|scholarship|research|job|competition|null
  deadline,                               // 'YYYY-MM-DD' or null — never guessed
  location, eligibility: [], skills: [], summary, url,
  status,                                 // saved|reviewing|started|applied|accepted|rejected
  savedAt, updatedAt
}
```

## Next Action rules
| Status | Condition | Next action | Button moves to |
|---|---|---|---|
| saved | no deadline | Find the deadline on the official page | reviewing |
| saved | ≤ 2 days | Decide now: apply today or drop it | started |
| saved | otherwise | Check eligibility (5 minutes) | reviewing |
| reviewing | — | Tailor your resume for {skills} | started |
| started | ≤ 2 days | Submit the application today | applied |
| started | otherwise | Finish the application questions | applied |
| applied | — | Wait; follow up after 2 weeks | — |
| any open | deadline passed | Archive it or look for next cycle | — |

## Opportunity Debt
Live (not expired, not applied) opportunities in `saved` or `reviewing` = saved but not acted on.

## Why rule-based, not an LLM (for now)
Deadlines must never be hallucinated. The extractor is deterministic and tested.
Next step: an optional IBM Granite (watsonx.ai) call behind the same `analyzeOpportunity()` interface
to improve summaries — its output would still be validated against the same rules.

## Roadmap (not in MVP)
Chrome extension "Save this page" button → same analyzer · Granite summaries · calendar (.ics) export · email/push reminders.
