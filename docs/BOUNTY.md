# KrackedDevs bounty: Build for Better Connectivity

BillWise is an entry for the [Build for Better Connectivity](https://krackeddevs.com/code/bounty/build-for-better-connectivity) bounty. Deadline: Monday 16 Nov 2026, 11:59 PM MYT.

- Live: <https://billwise-blush.vercel.app>
- Repo: <https://github.com/itsLucas02/billwise>
- Copy-paste submission text: [`SUBMISSION.md`](SUBMISSION.md)
- Official brief, verbatim: [`BOUNTY-BRIEF.md`](BOUNTY-BRIEF.md) (source of truth for the rules)

## The one choice

| | |
| --- | --- |
| Person | An ordinary Malaysian residential broadband customer who does not know billing terms |
| Problem | The bill is higher than expected, or has charges they do not understand |
| Outcome | They understand the bill, see possible issues and what is uncertain, and leave with a next step: a ready-to-send, editable billing enquiry (English or Bahasa Malaysia) with an evidence checklist, tracked as a case (reference, status, notes). A plan comparison is the alternative route. |

The rest of the app (plan finder, coverage notes, provider directory) supports that flow. The bill-to-enquiry path is the finished workflow.

## Requirements mapping

| # | Requirement | Where BillWise meets it |
| --- | --- | --- |
| 1 | Working tool for a clearly defined user | The user above; deployed and usable without sign-up |
| 2 | One problem, complete flow, no mockups | Bill in, breakdown, finding, enquiry, tracked case. All steps run against a real database |
| 3 | Link to working tool | <https://billwise-blush.vercel.app> |
| 4 | Short description: who, problem, how to use | [`SUBMISSION.md`](SUBMISSION.md) and the top of the README |
| 5 | Sample or synthetic data, simulated things labelled | Sample bills are invented and labelled as specimens. Savings figures are estimates and show their assumptions. Coverage results are what the user recorded |
| 6 | No private data, proprietary systems, or provider name/logo/branding without permission | No customer data, no provider APIs or scraping, no logos. Real provider names and badge colours are used: see the open risk below |

## Judge journey

1. Open the homepage, choose "Try a sample bill" (the Unifi promo-expiry sample), or paste your own bill.
2. Read the breakdown. Each charge is explained, findings are ranked "Act on this", "Worth checking", "Good to know" or "Looks fine", and savings estimates show their assumptions.
3. On a questionable charge, click to start a billing enquiry. Provider, charge, amount and the analysis link carry over.
4. Create the case. You get an editable enquiry in English or BM, a copy button and an evidence checklist. Nothing is sent to the provider.
5. Record the provider's reference, change the status, add notes. Refresh and reopen: it is saved.

## Data and uncertainty

- Findings come from deterministic rules and templates. There is no AI inference.
- Findings are ranked by severity ("Act on this", "Worth checking", "Good to know", "Looks fine") and phrased as questions to confirm with the provider where the bill alone can't prove it. Output is guidance for a conversation with the provider, not a ruling or legal advice.
- Savings are estimates and state their assumptions.
- Records are anonymous and per browser. There is no sign-up, and no personal data is needed.
- Sample bills are invented (fake account numbers and amounts).
- Plan data comes from each provider's public pages, checked by hand in Nov 2026. Prices change, so users should confirm with the provider.

## Decision and open risk: real provider names

Decision (owner): use the real Malaysian telco names (Unifi, Maxis, CelcomDigi, TIME, Allo, U Mobile). Plan data comes from their public pages, checked Nov 2026. BillWise is independent and not affiliated with any of them.

Risk, still open: the official requirement 6 (confirmed against the brief, see [`BOUNTY-BRIEF.md`](BOUNTY-BRIEF.md)) says "Do not use … a provider’s name, logo, or branding without permission." The body text of the brief says "branding" only, and the Plan Fit idea allows "clearly sourced, dated plans", so the rule can be read either way. Real names are used so the tool is useful to real customers, and no permission has been requested. If judges read that rule strictly, this entry may be marked down or disqualified. The history shows an earlier commit that used fictional providers; reverting to that is the fallback if the risk is judged too high.
