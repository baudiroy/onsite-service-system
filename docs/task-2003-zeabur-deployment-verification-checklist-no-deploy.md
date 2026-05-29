# Task 2003 - Zeabur Deployment Verification Checklist / No Deploy

## Scope

Task2003 defines a checklist for future Zeabur deployment verification without
performing deployment, redeployment, smoke, public endpoint probes, DB
connections, environment value inspection, or secret handling.

This document is planning-only and readiness-only. It is not authorization to
deploy, redeploy, probe public endpoints, run smoke, connect to a database,
inspect or print secrets, modify Zeabur environment variables, execute provider
calls, execute billing or payment behavior, execute AI/RAG providers, publish
customer-visible data, or mutate runtime state.

## Purpose

- Define what must be verified before any future Zeabur deployment or smoke
  task.
- Prevent accidental deploy, redeploy, public smoke, DB access, provider calls,
  billing/payment actions, AI/RAG calls, or customer-visible publication from
  generic continuation instructions.
- Separate non-secret deployment status observation from runtime execution.
- Tie future Zeabur actions to exact service names, exact targets, explicit
  forbidden actions, and sanitized reporting.

## Current Baseline

- `origin/main`: `d1e03c1cc17cf763ad2297e25d92acfaa8551b3b`.
- Task2001 Staged Deployment and Smoke Target Matrix is accepted and pushed.
- Task2002 Migration and Seed Authorization Matrix is accepted and pushed.
- Phase 20 remains staged runtime authorization and smoke execution planning.
- Existing Task1929 and Task1930 AI/RAG draft specs remain untouched and not
  executed.
- Existing held historical untracked docs must remain untouched.

## Non-authorization Statement

This checklist is not authorization to deploy.

This checklist is not authorization to redeploy.

This checklist is not authorization to probe public endpoints.

This checklist is not authorization to run smoke.

This checklist is not authorization to inspect, reveal, copy, or print secrets.

Each future Zeabur deployment, redeployment, public endpoint probe, route probe,
DB-backed smoke, migration, seed, provider, billing, payment, AI/RAG, or
customer-visible action still requires exact PM/user approval naming the target
and scope.

## Verification Categories

Future Zeabur verification should be structured by category and should report
only non-secret facts.

| Category | What to verify later | Reporting rule |
| --- | --- | --- |
| GitHub origin/main commit baseline | Confirm the intended Git commit before any deploy or observation. | Report commit hash only. |
| Zeabur project/service identity | Confirm the project and service are the intended backend service. | Report project/service name or non-secret identifier only. |
| Service root / repo / branch | Confirm repo, branch, and service root match the backend service. | Report repo, branch, root path only. |
| Build/start command | Confirm configured build and start commands match the backend. | Report command strings only if visible and non-secret. |
| Node version/runtime requirement | Confirm runtime supports Node.js `>=20`. | Report version requirement/status only. |
| Deployment status visibility | Confirm whether status is visible without triggering redeploy. | Report status text only. |
| Deployed commit visibility | Confirm deployed commit if visible without triggering redeploy. | Report commit hash only. |
| Backend domain visibility | Confirm backend domain if visible. | Report domain only; do not probe it without approval. |
| Health endpoint readiness | Confirm `/healthz` is a candidate endpoint for later exact-target smoke. | Do not call it without exact target approval. |
| Route availability readiness | Confirm route list candidates for later exact-target smoke. | Do not call routes without exact target approval. |
| Environment variable readiness by name only | Confirm required variable names are configured or pending. | Report names/status only; never values. |
| DB attachment readiness by reference/name only | Confirm DB attachment or reference name only. | Never print DB URLs or credentials. |
| Migration/seed state readiness | Confirm whether future migration/seed state verification is needed. | No DB command without Task2002 approval. |
| Provider integrations | Confirm providers remain disabled/deferred unless scoped. | No provider calls. |
| Billing/AI integrations | Confirm billing and AI/RAG remain disabled/deferred unless scoped. | No billing/payment/AI calls. |
| Rollback/previous deployment visibility | Confirm rollback visibility without clicking deploy/redeploy controls. | Report non-secret UI status only. |

## Allowed Future Verification Actions

These classifications define future actions only. They do not authorize any
action in Task2003.

| Action | Classification | Required approval before execution |
| --- | --- | --- |
| Local git status/log checks | Allowed for planning tasks. | Task scope must permit read-only local git checks. |
| Non-secret Zeabur UI status observation | Requires exact service approval. | Must name project/service and forbid env value inspection. |
| Non-secret deployment commit/status observation | Requires exact service approval. | Must name project/service and forbid redeploy. |
| `/healthz` probe | Requires exact target approval. | Must name exact URL and forbid DB/smoke expansion. |
| Route probe | Requires exact target approval. | Must name exact URL, method, route, auth posture, and forbidden mutations. |
| Deployment/redeploy | Requires separate explicit approval. | Must name exact service, commit, branch, rollback expectations, and forbidden actions. |

## Forbidden Actions Without Explicit Approval

The following remain forbidden unless a later task explicitly scopes and
approves them:

- Deploy.
- Redeploy.
- Public endpoint probe.
- Route probe.
- DB connection.
- SQL, psql, migration, or seed.
- Environment variable value inspection.
- Secret printing.
- Provider sending.
- Billing, payment, invoice, or payment-method behavior.
- AI/RAG provider call.
- Destructive smoke.
- Customer-visible publication.
- Completion Report / Field Service Report mutation.
- `finalAppointmentId` mutation.

## Exact Approval Phrase Templates

Use these as templates only. Replace bracketed placeholders before any future
execution. Generic continuation wording is not enough.

### Zeabur Non-secret Deployment Status Observation

I approve non-secret Zeabur deployment status observation for `[exact Zeabur
project/service name]` only. Do not deploy, do not redeploy, do not probe public
endpoints, do not inspect environment variable values, do not print secrets, do
not connect to DB, do not run migrations, do not run seed, do not run smoke, and
do not trigger providers, billing, payment, AI/RAG, or customer-visible
publication.

### `/healthz` Probe Against Exact Target

I approve `/healthz` read-only probe against `[exact backend URL]` only. Do not
call other routes, do not use DB write paths, do not run migrations, do not run
seed, do not inspect secrets, do not trigger providers, billing, payment,
AI/RAG, or customer-visible publication, and report sanitized status only.

### Route Safe-deny Probe Against Exact Target

I approve safe-deny route probe against `[exact backend URL]` for `[exact route
and method list]` only. Expected posture is `[unauthenticated or
permission-denied]`. Do not use allow-path credentials unless separately
approved, do not mutate DB state, do not run migrations, do not run seed, do not
inspect secrets, and do not trigger providers, billing, payment, AI/RAG, or
customer-visible publication.

### Manual Redeploy

I approve manual redeploy of `[exact Zeabur project/service name]` from
`[exact repo/branch/commit]` only. Do not modify env vars, do not inspect secret
values, do not run migrations, do not run seed, do not run smoke unless
separately approved, do not trigger providers, billing, payment, AI/RAG, or
customer-visible publication, and report sanitized deployment status only.

## Stop Conditions

Stop immediately and report if any of the following occurs or appears likely:

- Deployed commit is unclear.
- Environment variable value becomes visible.
- DATABASE_URL becomes visible.
- Target is ambiguous.
- Production/shared DB target is ambiguous.
- Unexpected deploy or redeploy prompt appears.
- Provider, billing, payment, or AI/RAG action risk appears.
- Route returns non-sanitized error, stack trace, SQL, or secret material.
- Secret exposure risk appears.
- UI asks for credentials, tokens, passphrases, or private keys.
- Any action would mutate DB state or customer-visible state.

## Relationship To Task2001 And Task2002

- Task2001 governs smoke target categories and exact target approval.
- Task2002 governs migration and seed authorization.
- Task2003 governs Zeabur deployment verification checklist boundaries.

Task2003 must not be used to bypass Task2001 or Task2002. Future Zeabur checks
that include runtime probing, DB access, migration, seed, or smoke must satisfy
the corresponding approval matrix first.

## Explicit Non-goals

Task2003 does not:

- Modify runtime source.
- Modify tests.
- Modify package or lockfiles.
- Modify admin frontend.
- Open or inspect Zeabur environment variable values.
- Probe Zeabur public endpoints.
- Deploy or redeploy.
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
