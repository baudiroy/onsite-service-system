# Task 2001 - Staged Deployment and Smoke Target Matrix / No Execution

## Scope

Task2001 defines target categories, smoke categories, and approval requirements
for future staged runtime smoke work.

This document is planning-only. It is not authorization to run smoke, deploy,
connect to a database, apply migrations, run seed, execute provider calls,
execute billing or payment behavior, execute AI/RAG providers, publish
customer-visible data, or mutate runtime state.

## Purpose

- Define target categories and smoke categories before any runtime smoke is
  approved.
- Prevent generic "run smoke", "continue", "next", or similar instructions from
  triggering DB, smoke, deploy, provider, billing, payment, AI/RAG, or
  customer-visible execution.
- Keep future smoke approval target-specific, bounded, and reversible.
- Preserve existing no-execution gates until PM/user approval names the exact
  target and allowed scope.

## Target Categories

| Target category | Description | Default posture |
| --- | --- | --- |
| Local synthetic / no server | Unit, contract, and static checks using fake clients only. | Allowed only when no runtime server or DB is touched. |
| Local runtime server | A locally started backend process. | Requires explicit runtime-start approval. |
| Disposable local/test DB | Throwaway PostgreSQL target created only for bounded testing. | Requires exact disposable DB target approval. |
| Zeabur backend public target | Public backend URL hosted on Zeabur. | Requires exact URL and route scope approval. |
| Zeabur test DB target | Approved Zeabur test PostgreSQL target. | Requires exact DB target approval and no secrets printed. |
| Zeabur production/shared DB target | Shared, staging, or production database attached to Zeabur. | Forbidden unless specifically and explicitly approved. |
| External provider sandbox target | LINE, SMS, email, storage, billing, or AI provider sandbox. | Requires provider-specific sandbox approval. |
| Provider production target | Production provider account or live customer-facing channel. | Forbidden unless specifically and explicitly approved. |

## Smoke Categories

| Smoke category | Description | Default posture |
| --- | --- | --- |
| `/healthz` read-only smoke | Basic read-only health endpoint check. | Requires exact public target URL unless purely local and explicitly scoped. |
| Unauthenticated safe-deny smoke | Confirms protected routes deny unauthenticated calls safely. | Requires exact target URL and route list. |
| Permission-denied safe-deny smoke | Confirms authenticated-but-disallowed access is denied safely. | Requires exact target, identity, and org scope. |
| Authenticated allow-path smoke | Confirms allowed user flow succeeds. | Requires exact target, identity, org, and allowed routes. |
| DB-backed read-only smoke | Reads existing DB state without mutation. | Requires exact DB target approval. |
| DB-backed write-path smoke | Creates or mutates records. | Requires exact DB target and write scope approval. |
| Migration verification smoke | Verifies schema or migration state. | Requires exact migration and DB target approval. |
| Seed verification smoke | Verifies seed-created account or fixtures. | Requires seed/test-data approval. |
| Provider sending smoke | Sends LINE, SMS, email, app push, webhook, or equivalent provider traffic. | Requires provider approval; forbidden by default. |
| Billing provider smoke | Exercises billing provider, invoice, payment, or payment-method behavior. | Requires billing/payment approval; forbidden by default. |
| AI/RAG provider smoke | Calls AI/RAG or embedding providers. | Requires AI/RAG provider approval; forbidden by default. |
| Customer-visible publication smoke | Publishes or changes customer-visible data. | Requires exact publication approval; forbidden by default. |

## Staged Smoke Matrix

Classification keys:

- `A`: allowed without extra approval, provided the task already permits this
  no-execution or synthetic check.
- `T`: requires exact target approval.
- `D`: requires DB target approval.
- `S`: requires seed or test data approval.
- `P`: requires provider, billing, payment, or AI/RAG approval.
- `F`: forbidden for now.

| Target category | Healthz | Safe deny | Auth allow | DB read | DB write | Migration | Seed | Provider | Billing | AI/RAG | Customer publication |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local synthetic / no server | A | A | A | F | F | F | F | F | F | F | F |
| Local runtime server | T | T | T | D | D | D | S | P | P | P | F |
| Disposable local/test DB | T | T | T | D | D | D | S | P | P | P | F |
| Zeabur backend public target | T | T | T | D | D | D | S | P | P | P | F |
| Zeabur test DB target | T | T | T | D | D | D | S | P | P | P | F |
| Zeabur production/shared DB target | F | F | F | F | F | F | F | F | F | F | F |
| External provider sandbox target | F | F | F | F | F | F | F | P | P | P | F |
| Provider production target | F | F | F | F | F | F | F | F | F | F | F |

## Conservative Defaults

- `/healthz` on an approved public backend target may be allowed only with the
  exact URL and no auth or secret material.
- DB-backed smoke requires explicit DB target approval.
- Write-path smoke requires explicit write scope approval.
- Provider, billing, payment, and AI/RAG smoke require separate future explicit
  approval.
- Production/shared DB targets are forbidden unless specifically and explicitly
  approved.
- Provider production targets are forbidden unless specifically and explicitly
  approved.
- Customer-visible publication behavior is forbidden unless a future task names
  the target, fixture, customer visibility, and rollback expectations.

## Exact Approval Phrase Templates

Use these as templates only. Replace bracketed placeholders before any future
execution. A generic continuation instruction is not enough.

### Read-only Public Endpoint Smoke

I approve read-only smoke against `[exact public target URL]` for
`[route list]` only. Do not use DB write paths, do not run migrations, do not
run seed, do not print secrets, do not trigger providers, do not trigger
billing/payment/AI, and do not publish customer-visible data.

### DB-backed Read-only Smoke

I approve DB-backed read-only smoke against `[exact DB target name]` and
`[exact public/local backend target]` for `[route list]` only. Do not mutate DB
state, do not run migrations, do not run seed, do not print DATABASE_URL or
secrets, do not trigger providers, do not trigger billing/payment/AI, and do
not publish customer-visible data.

### DB-backed Write-path Smoke

I approve DB-backed write-path smoke against `[exact DB target name]` and
`[exact backend target]` for `[specific fixture and route list]` only. Allowed
mutations are `[specific mutation list]`. Do not run migrations, do not run
seed, do not print DATABASE_URL or secrets, do not trigger providers, do not
trigger billing/payment/AI, and do not publish customer-visible data.

### Provider Sending Smoke

I approve provider sending smoke against `[exact provider sandbox target]` for
`[specific provider action]` only. Do not use production provider targets, do
not run DB write paths unless separately approved, do not print provider
secrets, do not trigger billing/payment/AI, and do not publish customer-visible
data.

### Billing Provider Smoke

I approve billing provider smoke against `[exact billing sandbox target]` for
`[specific billing action]` only. Do not create production invoices, do not
collect payment methods, do not create real payments, do not print provider
secrets, do not trigger unrelated providers, and do not publish
customer-visible data.

### AI/RAG Smoke

I approve AI/RAG smoke against `[exact AI/RAG sandbox or provider target]` for
`[specific prompt or retrieval action]` only. Do not use production data unless
explicitly approved, do not print provider keys, do not trigger provider
sending, do not trigger billing/payment behavior, and do not publish
customer-visible data.

## Existing Deferred Smoke Gates

The following gates remain deferred and require separate target-specific
approval:

- Task1871 Engineer Mobile DB-backed runtime smoke.
- Task1894 Repair Intake route smoke.
- Task1906 Admin Dispatch smoke.
- Task1917 Depot Workshop smoke.
- Task1927 SaaS Admin runtime smoke.

Approval for one gate must not be reused for another gate.

## Stop Conditions

Stop immediately and report if any of the following occurs or appears likely:

- Target is unclear or does not match the approved target phrase.
- Secret exposure risk appears.
- DB target is unclear.
- Route unexpectedly mutates state.
- Raw SQL, stack traces, or secrets are exposed.
- Provider sending is triggered unexpectedly.
- Billing, payment, invoice, or payment-method behavior is triggered
  unexpectedly.
- AI/RAG provider call is triggered unexpectedly.
- Customer-visible publication is triggered unexpectedly.
- Organization isolation bypass is suspected.

## Non-authorization Statement

This matrix is not authorization to execute smoke.

Each future smoke task still requires PM/user approval naming the exact target,
scope, allowed actions, forbidden actions, and rollback or cleanup expectations
where applicable.

## Explicit Non-goals

Task2001 does not:

- Modify runtime source.
- Modify tests.
- Modify package or lockfiles.
- Modify admin frontend.
- Connect to any DB.
- Run DB, SQL, psql, migration, seed, runtime, smoke, deploy, Zeabur, provider,
  billing, payment, invoice, or AI/RAG commands.
- Probe Zeabur public endpoints.
- Print DATABASE_URL, JWT_SECRET, tokens, private keys, provider keys,
  passwords, LINE secrets, billing provider secrets, Zeabur secrets, or
  passphrases.
- Mutate `finalAppointmentId`.
- Create, approve, publish, revoke, or mutate Completion Report / Field Service
  Report behavior.
- Create customer-visible publication behavior.
- Bypass organization isolation.
