# ADR 0002: Plan Finder assistant explains the ranking; it never makes one

- Status: accepted
- Date: 2026-11-16

## Context

People reading Plan Finder results ask follow-up questions the cards don't answer directly: "why is this first?", "is the cheaper one enough for three of us working from home?", "kenapa pelan ini?". A conversational helper makes the results easier to act on, but the bounty judges responsible handling of data and uncertainty. A model asked "which fibre plan?" will happily invent plans, prices, promotions and coverage. ADR 0001 kept AI to rewording facts BillWise already holds; this extends the same rule to plans.

## Decision

- **Inline Q&A under the results, not a site-wide chat.** "Ask about these matches" appears only after the customer runs Plan Finder. It is optional; the ranking and cards work without it.
- **The deterministic ranking stays the source of truth.** The browser sends the question (up to 500 characters), the form answers that produced the visible ranking, and the conversation so far. The server keeps only complete user-then-assistant pairs, the last 3 of them, each turn cut to 600 characters (`trimHistory`), since the browser can forge them. Without valid answers (a plan kind and a budget) it refuses with "Run the Plan Finder first" rather than ranking on defaults. The server re-runs `recommend()` on those answers itself (it never trusts scores from the browser) and builds the context from that result plus the catalogue entries in `src/lib/plans.ts`: rank, score, label, monthly cost, reasons and cautions, price, normal price, promo and bundle notes, speeds or data, contract, router, whether the price is from the provider's own site or a dealer/press listing, the source URL and the date prices were checked (`PLANS_REVIEWED`).
- **The model may only explain and ask.** The prompt (`buildPlanChatMessages` in `src/lib/ai.ts`) forbids plans, prices, promotions, speeds or coverage claims that are not in the context, and forbids reordering or re-scoring. If the customer describes needs that differ from their form answers ("actually we're 5 people"), it says which answer to change and to press **Show my best matches** again, instead of guessing a new ranking. It must not claim a plan is available at an address; it points to the Coverage page and the provider's own checker. It quotes prices as "RMx/month before 6% SST", says they were checked in the review month, and tells people to confirm on the provider's site before switching.
- **Language.** It replies in the language of the latest question: English or Bahasa Malaysia.
- **Cap and storage.** 10 questions per browser per rolling 24 hours, counted from a new `ai_usage` table (`user_id`, `feature`, `created_at`) for `feature = 'plan-chat'` only. This cap is separate from the 10 enquiry rewrites a day, which are still counted from `case_events`. As with the rewrite, the cap check is not atomic and failed AI calls are not counted. Questions and replies are not stored; the conversation lives in the page and resets only when the plan kind changes.
- **Proposing new answers (amendment, 17 Nov 2026).** When the customer describes needs that differ from their answers, the model may end its reply with `<prefs>{...}</prefs>` holding only the answers to change (budget, household, activities, usage, lines and similar; never coverage or signal). The server strips the tag, validates it with `parsePrefs` via `proposeChange` (same kind only, clamped, no-ops dropped) and returns a list of readable changes. The page shows them with an "Update my matches" button; nothing changes until the customer taps it, and the new ranking still comes from `recommend()`. The model never ranks.
- **Same LiteLLM setup as the rewrite.** `POST /api/plans/ask` calls the OpenAI-compatible endpoint from `LITELLM_BASE_URL`, `LITELLM_API_KEY` and `AI_MODEL`. With no AI configured the panel shows a message and nothing else changes.
- Scope was settled by the implementing agent from the code and ADR 0001; the owner was not interviewed.

## Consequences

- The question, the Plan Finder answers (budget, household, activities, providers marked available or with good signal) and the ranked catalogue go to the AI provider; the panel says so.
- The model can still word things imperfectly or answer vaguely. The cards, with their reasons and cautions, remain the authoritative view, and the panel says so.
- A question about a plan or provider outside the catalogue gets "BillWise doesn't list that" rather than an answer, which is less helpful but honest.
