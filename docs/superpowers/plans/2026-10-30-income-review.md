# Income Certificate Review Implementation Plan

> For agentic workers: use superpowers:executing-plans to implement the tasks, preserving conventional commits and the user's branch hierarchy.

**Goal:** Ship a bilingual officer workspace for fictional income certificate reviews with real Gemini assistance and persistent human decisions.

**Architecture:** React/Vite renders the workspace and talks to a same-origin FastAPI API. SQLAlchemy stores applications, evidence, reviews, and decisions in PostgreSQL or local SQLite. An environment-configured officer signs in through a server-side session; Gemini is server-side only.

**Tech Stack:** Python, FastAPI, SQLAlchemy, Alembic, React, TypeScript, Vite, PostgreSQL, pytest.

**Spec:** `docs/superpowers/specs/2026-10-30-income-certificate-review-design.md`

## Global constraints

- Fictional data only; English and Tamil; officer decides; no automatic AI fallback.
- Branches: main → 0.1.1-dev → feat/... or fix/...; conventional commits with confirmed user identity.
- Use an external persistent database in deployment. Configuration/secrets must not be committed.
- Same-origin production serving; login required for all case data.

## Review focus

- Unauthenticated and cross-origin writes must fail.
- Decision submission must reject stale revision and not overwrite an existing decision.
- AI errors and invalid citations must not prevent a manual decision.
- Switching language must retain unsaved decision notes and never call Gemini again.
- Seeding must not reset previously saved data.

## Tasks

### 1. Foundation, database, demo seed, and login

Files: `backend/app/{main,config,db,models,auth,seed}.py`, `backend/tests/`, migration files, dependency manifests, `.env.example`, `.gitignore`.

- [ ] Write and run failing tests for unauthenticated access, valid login, invalid login, logout, idempotent seed, and persisted cases.
- [ ] Implement environment-backed officer login, signed expiring cookie, server-side origin checking, models, migration, and explicit seed command with fictional cases.
- [ ] Run backend tests; commit on `feat/foundation`, then merge to `0.1.1-dev`.

### 2. Queue, evidence and officer decisions

Files: `backend/app/{routes,schemas}.py`, `backend/tests/test_applications.py`.

- [ ] Write and run failing tests for oldest-first queue/search/status/counts, evidence detail, required decision reason, all three actions, persistence, and stale/duplicate rejection.
- [ ] Implement authenticated API routes; use an atomic revision/status check and transaction for decisions.
- [ ] Run backend tests; commit on `feat/case-workflow`, then merge to dev.

### 3. Gemini assistance

Files: `backend/app/{ai,schemas}.py`, `backend/tests/test_ai.py`.

- [ ] Write and run failing tests for bilingual schema, invalid evidence IDs, caching, quota/provider failure, and manual decision despite failure.
- [ ] Implement configurable Gemini JSON generation, validation, timeout, per-case lock/cooldown, persisted review, and translated stable error codes.
- [ ] Run backend tests; commit on `feat/ai-review`, then merge to dev. Live provider test remains pending key and quota.

### 4. Bilingual officer interface

Files: `frontend/src/{App,api,i18n,styles}` and focused components; Vite configuration.

- [ ] Write and run a failing meaningful UI test for language switch preserving an in-progress decision.
- [ ] Build accessible login, queue, review, confirmation, AI states, and decision history in English and Tamil; preserve draft on errors.
- [ ] Run frontend test, typecheck/build, and browser checks where available; commit on `feat/officer-ui`, then merge to dev.

### 5. Integration and handoff

Files: `README.md`, deployment configuration, backend static serving, integration tests.

- [ ] Write failing tests for protected API, missing asset/API behavior, real SPA routes, and idempotent seed after decision.
- [ ] Add local/deployment instructions, startup/build configuration, migrate/seed commands, and limitations.
- [ ] Run backend suite, frontend tests/build, and desktop/narrow-screen end-to-end flow; commit on `feat/deployment`, then merge to dev.
- [ ] Verify real Gemini and deployed login → review → decision → reload when user credentials and hosting are available. Push and deploy `0.1.1-dev` using the user's authorized accounts.
