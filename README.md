# Certificate Desk

A bilingual demonstration workspace for an officer reviewing income certificate applications in Tamil Nadu. It brings a queue, fictional evidence, AI-assisted review, and a recorded officer decision together in one place. **All applicant information is fictional.** This is not a government service and does not issue certificates.

## The problem

When application details and supporting evidence are scattered across records, officers must spend time finding missing information and deciding which case to review next. Certificate Desk presents the oldest pending cases first and puts each application's supporting evidence next to an optional AI review. The officer remains responsible for checking the evidence and choosing the outcome.

The example is inspired by Tamil Nadu's [e-Sevai income certificate service (REV-103)](https://www.tnesevai.tn.gov.in/Citizen/UserManual.html). Document checks are simplified demonstration rules, not an authoritative statement of legal requirements. The queue marks a case older than 15 days as overdue using a **demo rule**. An income certificate records income; this application does not apply an income eligibility threshold.

## What it does

- Officer login; English / தமிழ் language switch.
- A searchable application queue showing pending, overdue, and attention counts.
- Fictional applicant information and supporting document text; cases with missing or conflicting evidence.
- On-demand Gemini assistance producing an English and Tamil summary, missing-document list, inconsistencies, suggested action, reasons and questions. Successful reviews are cached against case evidence.
- An officer chooses approve, reject, or return for correction, confirms a reason, and can view decision history. A revision check prevents conflicting decisions.
- Manual review and decisions remain available if AI is unavailable. The application does not substitute generated or canned text for a live AI response.

Tamil translations are machine-prepared draft copy and have not been reviewed by a fluent reader. Applicant names and fictional submitted evidence remain in their original language.

## Technical decisions

React + TypeScript and Vite provide the interface. FastAPI exposes the same-origin API, serves the built interface, and keeps the Gemini API key server-side. SQLAlchemy stores data in SQLite for local development or PostgreSQL for deployment; Alembic initializes the schema. There is one configured demo officer, with a PBKDF2 password hash and signed, expiring HTTP-only session cookie. This is deliberately simpler than a production identity system. AI output is validated with Pydantic and evidence IDs are checked against the current case. The officer's decision is separate from the AI suggestion.

There is no citizen portal, OCR, actual government integration, certificate issuance, or automatic AI provider fallback. Sample documents are stored as text, not scanned or verified. Returned applications cannot be resubmitted in this demo. Never use real citizen information with this project.

## Run locally

Requirements: Python 3.13, Node.js 22+, npm. Commands below assume a Unix shell and the repository root.

1. Set up the backend:

   ```bash
   python3 -m venv .venv
   .venv/bin/pip install -r backend/requirements.txt
   ```

2. Create an ignored local configuration file and choose a demo officer password:

   ```bash
   cp .env.example .env.local
   cd backend
   ../.venv/bin/python -m app.passwords
   ```

   The command prompts for a password and prints its hash. Edit `../.env.local`: set `OFFICER_USERNAME`, set `OFFICER_PASSWORD_HASH` to the hash **inside single quotes** (the hash contains `$`), replace `SESSION_SECRET` with a long random value, and add your `GEMINI_API_KEY` if available. Create a key in [Google AI Studio](https://aistudio.google.com/apikey). Only set `GEMINI_API_KEY` in the environment; never commit it. To generate a session secret, run `python3 -c 'import secrets; print(secrets.token_urlsafe(48))'`.

3. In the same backend terminal, load the settings, migrate, seed and run:

   ```bash
   set -a
   source ../.env.local
   set +a
   ../.venv/bin/alembic upgrade head
   ../.venv/bin/python -m app.seed
   ../.venv/bin/uvicorn app.main:app --reload --port 8000
   ```

   Seeding is idempotent: it inserts missing sample cases without resetting existing decisions. AI calls show an error when no Gemini key is configured, while manual decisions still work.

4. In a second terminal:

   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

   Open `http://localhost:5173` and sign in with the officer ID and password you chose. The development server proxies `/api` to FastAPI. Leave `APP_ORIGIN=http://localhost:5173` for this setup.

For a single-service production-style run, first run `npm ci && npm run build` inside `frontend`, set `APP_ORIGIN` to the backend origin (for example `http://localhost:8000`), then run the backend without Vite. FastAPI serves the built React app from `/`.

## Testing

```bash
cd frontend
npm ci
npm test
npm run build
cd ../backend
../.venv/bin/python -m pytest -q
```

The backend tests exercise login, protected routes, sample data, decisions, stale submissions, cached AI responses, AI-unavailable behavior, and same-origin checks. Gemini is mocked in automated tests; a live request is needed to verify your key, model availability, and quota.

## Deployment

`Dockerfile` builds the React app and serves it from FastAPI. Configure a persistent PostgreSQL `DATABASE_URL` and the environment variables in `.env.example` on a Docker-capable host. Configure `COOKIE_SECURE=true`, a unique strong `SESSION_SECRET`, your public HTTPS origin in `APP_ORIGIN`, a demo officer username and password hash, and a server-side Gemini key. The container applies migrations and runs the idempotent seed on startup. Do not use local container SQLite for a hosted instance: the filesystem can be ephemeral.

Example hosts include Render for the Docker web service and Neon for PostgreSQL. Account setup and free-tier availability vary. Deploy from `0.1.1-dev`, then verify login, both languages, a real AI review, an officer decision, and persistence after reload. Share the live URL and demo officer credentials privately with the hiring team.

## Known limitations

This is a time-boxed sample, not a production service. There is one shared demo account, in-process login rate limiting and AI request locking (appropriate only for one app process), no password reset, and no citizen data handling. Gemini can be wrong, unavailable, or rate-limited; its output is advisory. A real deployment would need validated Tamil copy, a review of current local procedures, accessibility testing, stronger identity and operational controls, and an evidence-verification process.
