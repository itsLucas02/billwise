# Glossary

- **Analysis**: the decoder's result for one bill: line items, findings, savings and next steps. Saved per browser, reachable at `/decoder/[id]`.
- **Finding**: one thing the decoder noticed on a bill, ranked "Act on this", "Worth checking", "Good to know" or "Looks fine".
- **Case**: a billing enquiry the customer is preparing or tracking (provider, issue, charge, amount, status, provider reference, timeline). Created from a finding or from scratch at `/help/new`.
- **Draft**: the enquiry message generated from a case by rules and templates, in English or Bahasa Malaysia, for email, chat or a call script. Editable.
- **AI rewrite**: an optional rewording of the draft (firmer, shorter, add my notes) using only the case facts. See ADR 0001.
- **Plan assistant**: the optional "Ask about these matches" Q&A on Plan Finder results. It explains the deterministic ranking using only the catalogue; it never ranks. See ADR 0002.
- **Timeline event**: an entry on a case (created, status change, note, contact, reply, follow-up, AI rewrite).
- **GCC**: the General Consumer Code of Practice for the Malaysian communications industry; clause 7.3 sets complaint acknowledgement and resolution timelines.
- **CFM**: Communications and Multimedia Consumer Forum of Malaysia, where unresolved complaints escalate.
