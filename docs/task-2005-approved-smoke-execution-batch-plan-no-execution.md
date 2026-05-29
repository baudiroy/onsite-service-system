# Task 2005 - Approved Smoke Execution Batch Plan / No Execution

## Scope

Task2005 defines a staged plan for future smoke execution after exact target
approvals are obtained.

This document is planning-only. It does not authorize smoke, deployment,
public endpoint probing, DB access, migrations, seed, provider sending,
billing/payment behavior, AI/RAG provider calls, customer-visible publication,
or runtime mutation.

## Purpose

- Define how future smoke execution should be batched.
- Prevent generic "run smoke", "continue", "next", or similar wording from
  causing execution.
- Establish that this plan is not execution authorization.
- Keep future smoke tasks tied to exact target names, exact route/method lists,
  exact identity posture, explicit forbidden actions, and sanitized reporting.

## Inputs From Prior Matrices

Task2005 depends on the planning boundaries already established in Phase 20:

| Source | Role in future execution planning |
| --- | --- |
| Task2001 Staged Deployment and Smoke Target Matrix | Defines target categories, smoke categories, approval phrase patterns, and stop conditions for smoke. |
| Task2002 Migration and Seed Authorization Matrix | Defines DB target and migration/seed authorization gates before any DB-backed smoke can run. |
| Task2003 Zeabur Deployment Verification Checklist | Defines non-secret Zeabur verification boundaries and separates observation from deploy/probe actions. |
| Task2004 Secrets and Environment Variable Readiness Review | Defines variable-name-only readiness review and prevents secret value inspection or printing. |

No future smoke batch may bypass these inputs.

## Proposed Future Smoke Execution Stages

The conservative staged order is:

| Stage | Name | Execution posture | Required approval before future execution |
| --- | --- | --- | --- |
| Stage 0 | Local/static checks only | No runtime server, no DB, no public target. | Task-specific approval for static/synthetic checks. |
| Stage 1 | Zeabur non-secret deployment status observation | UI/status observation only, no public endpoint probe. | Exact Zeabur project/service approval. |
| Stage 2 | `/healthz` against exact approved target | Read-only public health endpoint only. | Exact backend URL approval. |
| Stage 3 | Unauthenticated safe-deny route probes | Protected routes should deny unauthenticated requests safely. | Exact URL, route, method, and expected status approval. |
| Stage 4 | Permission-denied safe-deny route probes | Authenticated identity lacks permission or organization scope. | Exact identity, org, URL, route, and method approval. |
| Stage 5 | DB-backed read-only smoke | Reads DB-backed state without mutation. | Exact DB target approval under Task2002. |
| Stage 6 | Authenticated allow-path smoke with approved test data | Allows happy-path checks using approved fixtures. | Exact identity, org, test data, route, and expected mutation posture approval. |
| Stage 7 | Write-path smoke | Creates or mutates records. | Explicit write-scope approval, rollback/cleanup expectations, and DB target approval. |
| Stage 8 | Provider/billing/AI smoke | Provider, billing, payment, invoice, or AI/RAG behavior. | Future separately scoped provider/billing/AI approvals only. |

Progression is not automatic. Passing one stage does not authorize the next
stage.

## Candidate Smoke Areas

Future smoke batches may include these product areas only after exact target
approval:

| Area | Candidate posture | Notes |
| --- | --- | --- |
| Engineer Mobile | Safe-deny, DB-backed read-only, allow-path, write-path in later scoped tasks. | Task1871 remains gated for DB-backed runtime smoke. |
| Customer-facing report | Safe-deny, filtered read, and later publication-path checks. | Customer-visible publication remains forbidden without explicit approval. |
| Repair Intake | Route smoke and later Case creation path. | Formal Case creation remains gated. |
| Admin Dispatch | Permission and assignment boundary checks. | Write-path dispatch assignment requires explicit write approval. |
| Depot / Workshop | Read, filter, prepare, and later write-path checks. | Workshop write-path smoke remains gated. |
| SaaS Admin / entitlement | Admin entitlement, permission, trial, audit, and billing boundary checks. | Billing/payment remains deferred. |

## Future Task Candidates

Use Task2007+ numbers to avoid collisions:

- Task2007 - Approved Zeabur Non-secret Deployment Status Observation.
- Task2008 - Approved Public Healthz Smoke.
- Task2009 - Approved Safe-deny Route Smoke Batch.
- Task2010 - Approved DB-backed Read-only Smoke Planning.
- Task2011 - Approved DB-backed Read-only Smoke Execution.
- Task2012 - Approved Authenticated Allow-path Smoke Planning.
- Task2013 - Approved Authenticated Allow-path Smoke Execution.

Additional future tasks should continue the Task2014+ sequence and must declare
whether they are planning-only or execution-approved.

## Required Approval Phrase Templates

Use these as templates only. Replace bracketed placeholders before future
execution. Generic continuation wording is not enough.

### Non-secret Deployment Status Observation

I approve non-secret deployment status observation for `[exact Zeabur
project/service name]` only. Do not deploy, do not redeploy, do not probe public
endpoints, do not inspect environment variable values, do not print secrets, do
not connect to DB, do not run migrations, do not run seed, and do not trigger
providers, billing, payment, AI/RAG, or customer-visible publication.

### `/healthz` Smoke

I approve `/healthz` read-only smoke against `[exact backend URL]` only. Do not
call any other route, do not use DB write paths, do not run migrations, do not
run seed, do not inspect secrets, do not trigger providers, billing, payment,
AI/RAG, or customer-visible publication, and report sanitized status only.

### Safe-deny Route Smoke

I approve safe-deny route smoke against `[exact backend URL]` for `[exact route
and method list]` only. Expected posture is `[unauthenticated or
permission-denied]`. Do not use allow-path credentials unless separately
approved, do not mutate DB state, do not run migrations, do not run seed, do not
inspect secrets, and do not trigger providers, billing, payment, AI/RAG, or
customer-visible publication.

### DB-backed Read-only Smoke

I approve DB-backed read-only smoke against `[exact DB target name]` and `[exact
backend target]` for `[exact route and method list]` only. Do not mutate DB
state, do not run migrations, do not run seed, do not print DATABASE_URL or
secrets, do not trigger providers, billing, payment, AI/RAG, or
customer-visible publication, and report sanitized PASS/FAIL only.

### Authenticated Allow-path Smoke

I approve authenticated allow-path smoke against `[exact backend target]` using
`[exact test identity and organization scope]` and `[exact approved test data]`
for `[exact route and method list]` only. Do not exceed the approved fixture,
do not run migrations, do not run seed, do not print secrets, do not trigger
providers, billing, payment, AI/RAG, or customer-visible publication, and report
sanitized PASS/FAIL only.

### Write-path Smoke

I approve write-path smoke against `[exact backend target]` and `[exact DB target
name]` for `[exact route and method list]` only. Allowed mutations are `[exact
mutation list]`. Rollback or cleanup expectation is `[exact rollback/cleanup
plan]`. Do not run migrations, do not run seed, do not print secrets, do not
trigger providers, billing, payment, AI/RAG, or customer-visible publication,
and report sanitized PASS/FAIL only.

### Provider, Billing, Or AI Smoke

I approve `[provider/billing/AI]` smoke against `[exact sandbox target]` for
`[exact action]` only. Do not use production targets, do not print secrets, do
not run DB write paths unless separately approved, do not create real invoices
or payments, do not collect payment methods, and do not publish
customer-visible data.

## Stop Conditions

Stop immediately and report if any of the following occurs or appears likely:

- Target is unclear.
- Secrets are visible.
- DATABASE_URL is visible.
- DB target is unclear.
- Unexpected mutation occurs.
- Route exposes stack traces, SQL, raw DB rows, or secrets.
- Organization isolation bypass is suspected.
- Provider, billing, or AI behavior is triggered unexpectedly.
- Customer-visible publication is triggered unexpectedly.
- A route requires credentials, tokens, private keys, passphrases, or provider
  keys in Codex chat.
- A requested step exceeds the approved target, method, route, identity, org,
  fixture, or write-scope boundary.

## Non-authorization Statement

This plan does not authorize smoke.

Each future smoke task needs exact PM/user approval with target, scope, route
list, identity posture, forbidden actions, and reporting expectations.

## Explicit Non-goals

Task2005 does not:

- Modify runtime source.
- Modify tests.
- Modify package or lockfiles.
- Modify admin frontend.
- Probe Zeabur public endpoints.
- Deploy or redeploy.
- Inspect or print Zeabur environment variable values.
- Connect to any DB.
- Run DB, SQL, psql, migration, seed, runtime, smoke, provider, billing,
  payment, invoice, or AI/RAG commands.
- Print DATABASE_URL, JWT_SECRET, tokens, private keys, provider keys,
  passwords, LINE secrets, billing provider secrets, AI keys, Zeabur secrets, or
  passphrases.
- Mutate `finalAppointmentId`.
- Create, approve, publish, revoke, or mutate Completion Report / Field Service
  Report behavior.
- Create customer-visible publication behavior.
- Bypass organization isolation.
