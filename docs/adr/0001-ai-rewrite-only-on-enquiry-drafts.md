# ADR 0001: AI rewrites enquiry drafts only; the rule engine stays the source of truth

- Status: accepted; amended by [ADR 0002](0002-plan-finder-assistant-explains-ranking-only.md), which adds a Plan Finder assistant under the same rule
- Date: 2026-11-16

## Context

BillWise was built for the "Build For Better Connectivity" bounty, which judges whether data and uncertainty are handled responsibly. Bill analysis, findings, savings and first drafts were all deterministic. We wanted AI to make the main outcome (a billing enquiry the customer sends themselves) better, without letting it invent charges, amounts or legal claims.

## Decision

- AI is used in one place: rewriting the existing enquiry draft on the case page, with three actions: **Make it firmer**, **Make it shorter**, **Add my notes**.
- The prompt (`src/lib/ai.ts`) tells the model what BillWise is and who it serves, and forbids adding facts, changing amounts, adding laws beyond GCC clause 7.3, threats, or implying the message was sent. It receives only the case fields, the current draft and, for "Add my notes", the case timeline notes. The account reference is already reduced to its last 4 digits.
- The call goes from the server route `POST /api/cases/[id]/rewrite` to an OpenAI-compatible LiteLLM endpoint (`LITELLM_BASE_URL`, `LITELLM_API_KEY`, `AI_MODEL`, default `gpt-5.4-mini`). Keys live in Bitwarden (`BILLWISE__LITELLM_*`) and Vercel env, never in the repo.
- Each browser gets 10 rewrites per rolling 24 hours, counted from `case_events` rows of kind `ai`, which also show in the case timeline.
- Failures leave the draft unchanged and show a message. The rule-based draft works with no AI configured. Undo restores the previous draft.

## Consequences

- Draft text and case details leave BillWise for the AI provider; the UI says so under the buttons.
- Bill analysis stays explainable and testable; AI never decides what is wrong with a bill.
- The model can still reword imperfectly, so the customer must review before sending (stated in the UI).
