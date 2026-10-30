# Income certificate review — proposed design

Status: **Approved for implementation on 30 October 2026.**

## Intent and scope

Build a small, deployed officer workspace for reviewing fictional Tamil Nadu income-certificate applications. A reviewer can log in, find a case needing attention, inspect evidence, request Gemini assistance, and save their own approve/reject/return decision. English and Tamil cover the full core workflow.

The assignment requests 4–6 hours. Aim for 12 fictional applications, one officer role, one queue, one review page, and a decision-history view. Exclude citizen intake, real identity verification, OCR, uploaded-file ingestion, real certificate issuance, multiple approval stages, chat, and automatic model fallback.

## Confirmed choices versus proposals

Confirmed by user: income certificates, Tamil Nadu, English/Tamil switch, Python/FastAPI, React, code-first UI, conventional commits, local Git first, main → 0.1.1-dev → feat/fix workflow, deploy/share 0.1.1-dev.

Proposed builder choices: React + TypeScript + Vite, CSS variables and a small reusable component set, React Router, FastAPI + Pydantic + SQLAlchemy, PostgreSQL for hosted persistence, pytest for backend tests, and a minimal frontend test setup only where it checks meaningful behavior.

## Approaches

User selected React and FastAPI over leaving framework choice open. For that stack:

1. **Recommended: one web service.** Build React assets and serve them from FastAPI alongside `/api`. Simpler same-origin login and one application URL. Requires a build environment with Python and Node, or a multi-stage container.
2. **Alternative: separate static frontend and API hosts.** Independent hosting but adds cross-origin cookie, CORS, and environment configuration. Useful if the user already has preferred hosts.

One web service is the chosen approach; hosting accounts have not been inspected or created. Render web service plus Neon PostgreSQL are candidates. Render free web services can sleep and use an ephemeral filesystem; do not put the deployed database on local SQLite. A different user-preferred Python-capable host is acceptable without changing the core architecture.

## UI and interaction

See `docs/ui-research.md`. The proposed visual world is calm and legible: warm neutral surfaces, dark text, teal actions, restrained status colours, and no official branding. Use a compact top bar rather than a large sidebar for two destinations.

### Queue

Display pending/overdue/needs-attention counts computed from actual records. Search by fictional applicant name or reference, filter by status, and sort by submitted date/age. Default to pending applications ordered oldest first. Attention reasons come from explicit sample rules, not an unrun AI call.

For the demo, mark a pending application as overdue after 15 calendar days, labelled as a prototype queue rule rather than a verified statutory deadline. Needs attention means a missing required demo document or contradictory income evidence. Never use demographic or inferred personal traits to rank applications.

### Review

Show identity/address summary, household income rows, annual total, and evidence. Supply fictional text documents readable in-app, each clearly marked sample. Monthly/annual amounts and periods must be explicit.

AI area contains summary, missing evidence, inconsistencies with referenced evidence identifiers, suggested action, reasons, and unresolved questions. It must distinguish observed facts from items needing officer verification. No fabricated confidence percentage. It cannot change application status.

Decision area: choose Approve, Reject, or Return for correction; enter an officer reason; review a confirmation containing case, action, and reason; submit explicitly. Do not preselect the AI suggestion. Require a reason for every decision. Disable only during saving, retain notes on error, and show a success message with the persisted decision.

Final decisions are terminal in this demo; a returned application is viewable but cannot be resubmitted because citizen intake is out of scope. Provide fresh pending sample cases for subsequent testing. No public reset/delete endpoint.

### Language and accessibility

Use English and Tamil message dictionaries for every core label, status, validation message, error, confirmation, and empty state. Preserve selected language locally. Update document `lang`. Language changes preserve route, filters, and decision draft. Show a confirmation or route guard before leaving an unsaved decision page.

Generate both English and Tamil text in one structured AI review when supported, keeping shared action and evidence IDs language-neutral. Switching language must not make another paid/quota-consuming request. Validate both language objects. If either language output is absent or invalid, show a generation error and do not mislabel English as Tamil.

Use labelled inputs, visible keyboard focus, semantic tables/headings, accessible status text, sufficient contrast, and accessible confirmation dialogs. At narrow widths, stack content without hiding decision controls. Respect reduced motion. Tamil translations are draft until reviewed by a fluent reader.

## Data and rules

Use SQLAlchemy models: `Application`, `Document`, `AIReview`, `Decision`. A configured demo officer can be environment-backed rather than requiring user registration.

Application: stable ID/reference, fictional applicant and address, household income items, submitted timestamp, current status, revision, and required demo-document types.
Document: stable ID, application ID, type, title, sample text content, relevant structured facts. Treat structured fields as sample provided data, not OCR results. List expected missing document types in the case definition. Do not declare every government-listed document mandatory.
AIReview: case revision, evidence hash, prompt/rules version, provider/model, generation timestamp, validated bilingual output. Decision: application ID, officer ID, action, original reason and language, timestamp, prior revision. Store decisions in database, not browser storage.

Seed 12 fictional cases covering complete evidence, missing income evidence, monthly/annual mismatch, address discrepancy, long-pending complete case, and previously decided records. Case documentation must explain demo rules. An income certificate records income; do not invent a maximum income eligibility threshold or describe financial need as grounds for rejection.

Seed via an explicit idempotent command that only inserts missing stable IDs; restarting or redeploying must never reset existing decisions. Use an initial Alembic migration. Database state persists independently of app host restarts.

## API contract

- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.
- `GET /api/applications`: optional query/status/sort; derived summary counts from server.
- `GET /api/applications/{id}`: evidence, checks, saved AI review, and decision.
- `POST /api/applications/{id}/ai-review`: returns valid cached review for the evidence/prompt version, or generates one; no automatic re-generation on navigation.
- `POST /api/applications/{id}/decision`: action, reason, reason language, expected revision.
- `GET /api/decisions`: saved history.
- `GET /api/health`: minimal health response without secrets.

All application/evidence/AI/decision routes require authentication. Return structured errors with stable codes that the UI translates. Unknown cases return 404. A second/stale decision returns 409. Make the revision/status check, decision insert, and application update one transaction. Do not hold a database transaction open while waiting on Gemini.

## Authentication and AI boundaries

One demo login; no registration or password reset. Store username/password hash and signing secret in environment variables, never in source. Signed, expiring HTTP-only session cookie; Secure on HTTPS; SameSite=Lax; verify Origin on state-changing requests. Vite proxies `/api` locally; production remains same-origin. No frontend API key, secret, or database credentials. Include basic login throttling.

Gemini credentials stay server-side. Verify a real key and selected model with a small request before final integration. Use a configurable `GEMINI_MODEL`; do not assume free-tier availability. Request JSON matching a Pydantic schema and validate it server-side. Treat evidence as untrusted data; do not follow embedded instructions. Reject evidence references not belonging to this case. Do not claim semantic correctness merely because schema validation passed.

Configure a bounded provider timeout and modest output size. Map absent key, timeout, quota, and malformed output to actionable translated messages. No retry loop or automatic Groq calls. Use per-case generation lock plus a modest server-side cooldown to reduce duplicate calls; an in-memory guard is acceptable for a single-process demo, with its limit documented. Existing successful review remains readable if a provider call later fails. Manual decisions remain available independently.

Automated tests may stub Gemini, but the submitted app must use real Gemini for live AI assistance. Never substitute deterministic text and present it as model output. If real access is still unavailable, identify that as an unresolved submission requirement.

## Hosting, Git, and handoff

Production build must serve SPA routes without swallowing `/api` errors or missing asset responses. Include exact local setup commands, env template without secrets, database migration/seed steps, frontend build, backend start, limitations, sources, and architecture explanation in README.

Before Git changes, inspect current repository and verify user.name/user.email. Do not invent identity or change global Git settings. Create main, then 0.1.1-dev, then scoped feat/... branches from dev. Merge completed changes into dev with conventional commit messages. Do not push, publish a repository, or deploy until local checks pass and the user provides the GitHub destination/account and hosting access. User already authorizes pushing/deploying once finished; do not re-ask for generic permission. Share a branch-specific repository URL and deploy from that branch.

The current `.git` directory may be managed/read-only: verify actual Git operation support rather than treating the directory's presence as a repository. If restricted, use an explicitly scoped escalation or safe isolated checkout; preserve all project files and user identity requirements.

## Acceptance checks

1. Provided demo credentials work; application APIs reject unauthenticated requests; logout expires access.
2. Queue search/filter/sort/counts work from actual data; oldest pending case can be found.
3. All case evidence is fictional and inspectable; no unsupported verification claims.
4. Real Gemini generates a structured, evidence-linked review; revisiting/switching language reuses it.
5. Quota/timeouts/malformed output show clear errors and leave manual review usable.
6. Approve/reject/return require explicit officer action/reason and survive reload and process restart.
7. Duplicate/concurrent decisions cannot overwrite each other; save errors preserve notes.
8. English/Tamil cover login, queue, review, decisions, history, and errors without losing drafts.
9. Desktop and narrow-screen layouts support keyboard use and legible Tamil text.
10. Frontend typecheck/build and focused backend tests pass. Hosted URL is tested through login → AI → decision → reload, not just a health check.

## Proposed implementation sequence and effort budget

This is a scope estimate, not a promise. Keep total assignment effort within 4–6 hours and record actual time. Detailed executable tasks follow design approval.

1. Foundation, Git, schema, sample cases, and session login — about 60 minutes.
2. Code-first queue/review UI and bilingual messages — about 90 minutes.
3. Gemini review, persisted decisions, history, and failure states — about 75 minutes.
4. Focused tests, visual check/fixes, README, deployment, and hosted verification — about 90 minutes.

If time tightens, simplify visual polish and history presentation; preserve working login, bilingual core screens, live AI, persisted decisions, deployment, and README. No scope expansion to citizen submissions or OCR.

## Pending input and approval

- Resume is optional and has not been supplied; do not claim to have reviewed it.
- Actual Git identity and GitHub repository destination, when Git operations require them.
- Gemini account/key and hosting/database access. Never request secrets pasted into chat.
- Hosting recommendation can change to fit accounts the user already has.
