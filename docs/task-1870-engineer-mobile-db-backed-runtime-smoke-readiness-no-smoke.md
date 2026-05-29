# Task1870 Engineer Mobile DB-Backed Runtime Smoke Readiness / No Smoke

## Status

Task1870 is a readiness plan only.

This task does not connect to a database, run SQL, run `psql`, run `npm run db:migrate`, apply migration 023, run seed, start runtime, run smoke, touch Zeabur env vars, deploy, or print secrets.

## Current Baseline

- `origin/main` at Task1870 start: `d27ca9fc31b8399f53242d1157c8ff81884bb221`.
- Task1867 created the migration 023 apply authorization packet.
- Task1868 confirmed that a safe Zeabur migration target is not yet named or confirmed.
- Task1864 migration 023 disposable local/test dry-run is recorded as PASS in the PM runtime packet baseline.
- Task1865 implemented the Engineer Mobile visit action SQL repository adapter with injected `dbClient` only.
- Task1866 hardened the SQL repository contract and boundary tests.
- Migration 023 has not been applied to Zeabur, shared, staging, or production DB in this branch.
- No seed has been run.
- No provider sending is authorized.
- Completion Report / FSR, `finalAppointmentId`, and customer-visible publication behavior remain out of scope.

## Smoke Route Under Plan

The Engineer Mobile visit-action runtime route under future smoke planning is:

```text
POST /engineer-mobile/appointments/:appointmentId/actions/:action
```

This Task1870 document only defines readiness and approval gates for a future Task1871 smoke. It does not execute the route.

## Preconditions Before Task1871 Can Run

Task1871 must not run until all of the following are true:

- Task1869 has applied migration 023 to an explicitly approved target, or PM/user explicitly chooses a non-apply smoke path that does not need migration-backed persistence.
- The approved smoke target name is recorded as a non-secret label.
- The target classification is recorded as disposable local/test or another explicitly approved target.
- `DATABASE_URL` is not printed and is never copied into docs, chat, terminal output, logs, screenshots, or commits.
- Required auth, engineer, organization, assignment, appointment, and case data prerequisites are known.
- Any seed/admin/test-user bootstrap need is handled by a separate approved task.
- The deployed route commit is known.
- `/healthz` is reachable on the approved target.
- Provider sending remains disabled.
- Completion Report / FSR behavior remains disabled and out of scope.
- `finalAppointmentId` remains untouched.
- Customer-visible publication behavior remains out of scope.

## Smoke Data Requirements

A future DB-backed smoke needs non-production fixture data or explicitly approved test data:

- an authenticated engineer identity,
- an organization context for that engineer,
- an appointment assigned or eligible for that engineer,
- a case linked to the appointment and scoped to the same organization,
- a valid visit action that is safe for the appointment state,
- a known unsupported action for safe-deny verification,
- a known denied assignment or organization mismatch path,
- expected response envelopes that do not expose raw DB rows,
- no live customer-visible report or publication side effect.

If any of these are unknown, Task1871 must pause before running smoke.

## Minimal Future Smoke Sequence

The smallest future smoke sequence after explicit Task1871 approval should be:

1. `GET /healthz`
   - Expected: service health response without secrets.
2. Unauthenticated visit-action request.
   - Expected: `401` or `403` safe deny, not `404`, and no stack trace.
3. Authenticated `auth/me` or equivalent identity check if the target requires it.
   - Expected: authenticated engineer or approved test principal is scoped to the expected organization.
4. Unsupported visit action against the route.
   - Expected: safe deny / unsupported action envelope, no persistence mutation.
5. Assignment or organization mismatch request.
   - Expected: safe deny, no cross-organization data exposure.
6. Authorized engineer visit-action path only if safe test appointment data exists.
   - Expected: accepted action response using the existing public API envelope and no raw DB row exposure.
7. Persistence failure behavior only if safely injectable or observable without causing data damage.
   - Expected: sanitized failure envelope, no secret or SQL leakage.

No destructive fixture smoke is part of this sequence.

## What Must Not Be Tested Yet

Task1871 must not include any of these unless a later PM/user approval explicitly expands scope:

- destructive fixture smoke,
- production/shared data smoke,
- provider sending,
- LINE / SMS / Email / App push,
- webhook delivery,
- Completion Report / FSR creation,
- `finalAppointmentId` mutation,
- customer-visible publication,
- billing / settlement,
- AI / RAG / vector indexing,
- admin frontend deployment,
- seed bundled into the smoke task,
- migration bundled into the smoke task.

## Stop Conditions

Stop before or during a future smoke if:

- migration state is unclear,
- smoke target is unnamed,
- `DATABASE_URL` or credentials would be printed,
- the route returns `404` after the deployed commit is expected to include it,
- authentication is bypassed unexpectedly,
- organization isolation bypass is suspected,
- assignment mismatch is accepted unexpectedly,
- raw SQL, raw DB rows, secrets, stack traces, or provider tokens appear in responses or logs,
- seed data is unclear or missing,
- provider sending is triggered,
- Completion Report / FSR behavior is created,
- `finalAppointmentId` is selected, inferred, exposed, or mutated,
- customer-visible publication behavior is created,
- a smoke action would mutate production/shared/customer data.

## Recommended Task1871 Approval Phrase

Task1871 must not run without an explicit approval phrase substantially equivalent to:

```text
I approve running the Engineer Mobile DB-backed runtime smoke against the explicitly named target: <TARGET_NAME>. Do not use any other target. Do not print DATABASE_URL or secrets. Do not run migration or seed. Do not trigger provider sending, Completion Report / FSR creation, finalAppointmentId mutation, or customer-visible publication.
```

The approval must name the target and must not rely on generic continuation wording.

## Task1870 Recommendation

Task1870 recommends pausing before Task1871 until:

- Task1869 has either completed against an explicitly approved target, or PM/user explicitly chooses a smoke path that does not depend on migration-backed persistence,
- target name and classification are recorded,
- test identity and appointment prerequisites are known,
- seed requirements are either already satisfied or handled by a separate approval.

## Verification Boundary

Task1870 verification is limited to repository status and static project checks.

No DB connection, SQL, migration dry-run, migration apply, seed, Zeabur env change, deploy, runtime start, or smoke is authorized by this document.
