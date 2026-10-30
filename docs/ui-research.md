# UI research — 30 October 2026

This is a proposed design based on documentation research, not officer interviews or a usability study. No live government application has been visually audited or copied.

## Sources and how they inform this design

| Source | Relevant pattern | Proposed use |
| --- | --- | --- |
| [GOV.UK summary list](https://design-system.service.gov.uk/components/summary-list/) | Readable label/value summaries | Applicant and household evidence in the review page. |
| [GOV.UK complete multiple tasks](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/) | Clear progress and completion states | Document checklist with explicit present/missing states. |
| [GOV.UK error summary](https://design-system.service.gov.uk/components/error-summary/) | Error summary linked to invalid fields | Decision form validation and focus handling. |
| [USWDS table](https://designsystem.digital.gov/components/table/) | Readable tables and small-screen variants | Application queue with sortable headers and stacked mobile rows. |
| [USWDS language selector](https://designsystem.digital.gov/components/language-selector/) | Visible language choice and language attributes | English / தமிழ் control; correct document and mixed-text language metadata. |
| [Tamil Nadu e-Sevai service list](https://www.tnesevai.tn.gov.in/Citizen/UserManual.html) | Income certificate is a listed revenue service, REV-103 | Ground the chosen process in the local context. |
| [Tamil Nadu service details](https://www.tnesevai.tn.gov.in/citizen/Pages/ServiceList.aspx) | Listed income-certificate supporting document categories | Inform fictional sample evidence. Do not treat every listed category as mandatory for every household. |

## Design conclusion

Use a queue-first officer workspace. A table makes pending cases comparable, and a full review page gives evidence and AI findings enough room. Avoid decorative analytics that do not help the next review decision.

Alternative directions considered: a document-first desk is useful for extensive PDF inspection but adds viewer complexity; a guided wizard gives clear steps but makes it harder to compare findings and evidence. A queue plus a two-column review page best fits this bounded demonstration. Recommendation is pending user approval.

## Visual proposal

- Working title: **Certificate Desk**. Income certificate review is the service subtitle. Name is a proposal, not an approved brand.
- Warm off-white application background, white work surfaces, dark ink text, deep teal primary controls.
- Amber identifies attention needed; red identifies a blocking issue or rejected status; green identifies approved/completed status. Always pair colour with text.
- Compact top navigation: Applications and Decision history. Persistent language control and officer menu.
- Clear typography, primarily 16px body text, restrained headings, subtle dividers, 8px spacing rhythm, modest corner rounding.
- Proposed fonts: Public Sans for English and Noto Sans Tamil for Tamil, with robust system fallbacks. Keep Tamil line-height generous; no fixed-height text containers.
- No government emblem, official-service claims, decorative charts, hero imagery, or ornamental animations.
- Desktop is primary. Narrow screens stack evidence, AI findings, and decision controls in reading order.

## Screens

1. **Officer login:** service name, language switch, labelled fields, sign-in action, and a short sample-data notice.
2. **Applications:** heading and pending count; small actionable counts for pending, overdue, and needs attention; search and status filter; queue with application reference, applicant, submitted date, status, age, and an attention reason. Review is the main row action.
3. **Review:** breadcrumb and case identity; applicant, household income, and fictional document evidence on the left; AI summary, evidence-linked findings, and proposed action on the right. AI generation is explicit and its provenance/time are visible. Officer decision form is a separate section below.
4. **Decision history:** saved application decisions with officer, time, action, and reason; link back to the application. No extra analytics module.

## Important states

Loading; no search results; AI not yet run; AI running; AI rate limit; AI unavailable; saved AI review; missing evidence; decision validation error; save failure with draft preserved; saved decision; stale/concurrent decision; expired login.

Tamil changes the entire interface and AI explanation language. Original citizen names and evidence content remain source data; do not invent translations of documents or alter submitted facts.
