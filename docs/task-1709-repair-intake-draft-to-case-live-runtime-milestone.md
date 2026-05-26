# Task 1709 - Repair Intake Draft To Case Live Runtime Milestone

## Status

Completed for PM review.

## Purpose

Record the live Zeabur Draft to Case runtime milestone after the UUID replay fix.

This is a docs-only checkpoint. It does not change runtime behavior, source code, tests, migrations, server startup, package files, admin UI, DB state, deployment configuration, or provider settings.

## Live Runtime Milestone Summary

- The protected admin Draft to Case route remains deployed behind the existing feature flag.
- Live Zeabur health check returned `200`.
- Admin login returned `200`.
- Happy-path Draft to Case submit returned `200`.
- Response `caseRef.id` and `caseRef.caseId` were verified as UUID v4 values.
- Database `cases.id` for the created case was verified as a UUID v4 value.
- `case_no` remained separate from the UUID case id.
- Same idempotency-key replay returned `200` with `idempotentReplay=true`.
- Replay returned the same UUID case id and did not create duplicate rows.
- Denied no-token request returned `401 AUTH_REQUIRED` with no writes.
- Not-found draft request was safe and produced no writes.
- Already-converted / duplicate protection kept the persisted row counts at one case, one conversion, one audit, and one idempotency record.
- Cleanup completed and verified zero remaining smoke rows.
- Runtime credential values were not printed.

## Final Verification Evidence

Latest Task1708 final deployed verification result:

```text
health: 200
login: 200
happy submit: 200
replay: 200
denied: 401
not-found: safe no-write path
duplicate/already-converted protection: PASS
case/conversion/audit/idempotency counts: 1/1/1/1
cleanup: zero smoke rows
npm run check: PASS
git diff --cached --name-only: empty
git diff --name-only: empty
git status --short --branch: only 7 held historical docs untracked
```

Current committed baseline after the UUID replay fix:

```text
branch: main
HEAD: 888eef0143960fd5e4a5d1a78af15ed8620c936d
last commit: 888eef0 fix repair intake draft case uuid replay
```

## Runtime Readiness Boundary

This checkpoint means the deployed backend Draft to Case path has current live Zeabur evidence for:

- health and authenticated admin access,
- happy-path submit,
- UUID case id behavior in both API response and persisted `cases.id`,
- separation of `case_no` from UUID identifiers,
- idempotent replay with the same UUID,
- denied request protection,
- not-found no-write protection,
- already-converted duplicate protection,
- smoke cleanup.

This document does not authorize broader rollout, customer-visible enablement, admin UI expansion, provider sending, schema changes, migration work, AI/RAG, billing/settlement, or shared smoke/runtime expansion.

## Explicit Non-goals

- No backend `src/` change.
- No test change.
- No migration change.
- No server startup change.
- No package or lockfile change.
- No admin UI change.
- No API shape change.
- No DB action in Task1709.
- No migration apply or dry-run.
- No `psql`.
- No `npm run db:migrate`.
- No provider sending.
- No LINE/SMS/email/webhook/App push.
- No AI/RAG call.
- No billing or settlement runtime.
- No credential, token, secret, DB URL, or customer data exposure.
- No staging.
- No commit.
- No push.

## Core Invariant Confirmation

- A Case still has at most one formal Field Service Report.
- `field_service_reports.case_id` uniqueness is not changed.
- `finalAppointmentId` behavior is not changed.
- Manual `finalAppointmentId` override behavior is not changed.
- Case may still have multiple appointments / dispatch visits.
- Draft to Case runtime verification did not create or authorize any second formal Field Service Report behavior.
