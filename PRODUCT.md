# Income Certificate Review

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
User selected Python with FastAPI for the backend and React for the frontend.
TypeScript, Vite, database, hosting, and authentication details below are proposals, pending design approval.
The user selected designing directly in code rather than generating image mockups.

## Users
Tamil Nadu government officers reviewing income certificate applications.
Hiring reviewers will evaluate the deployed demonstration using a provided officer login.

## Product Purpose
Help an officer identify applications needing attention, understand submitted evidence, obtain AI assistance, and record a reasoned final decision.

## Operating Context
Kenpath Full Stack AI Engineer take-home assignment. Requested effort: 4–6 hours.
Email deadline: 31 October 2026. User's target submission date: 30 October 2026.
Only fictional citizen data. This is a demonstration, not an official government service.

## Capabilities and Constraints
- One service: income certificate review.
- English and Tamil across the officer workflow, including AI assistance.
- Officer makes all approval, rejection, and return-for-correction decisions.
- Gemini is the initial AI provider, pending a real account/key/quota check. No automatic Groq fallback.
- AI failure must leave manual review and decisions usable.
- Work locally with Git first. Use main, integration branch 0.1.1-dev, and feat/... or fix/... branches from it. Share and deploy 0.1.1-dev.
- Conventional commits under the user's verified Git identity; no Codex attribution or co-author trailers.

## Evidence on Hand
Assignment email supplied in conversation. No resume, existing application, brand assets, API credentials, or hosting account details supplied.
User speaks Tamil but cannot comfortably read it. Tamil copy can be prepared but must not be represented as fluent-reader validated without such review.

## Product Principles
- Put the officer's next useful action first.
- Show the evidence behind findings; do not present AI output as verified fact.
- Preserve the officer's authority and decision history.
- Keep a complete, small demonstration within the assignment effort limit.
- Let the user understand and demonstrate the full workflow in English.
