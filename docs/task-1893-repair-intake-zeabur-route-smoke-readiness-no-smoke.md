# Task1893 Repair Intake Zeabur Route Smoke Readiness / No Smoke

Status: readiness documented only. No smoke executed.

## Current Branch State

- Accepted baseline: `origin/main` = `e6b3e7387e841df47282f7037f9693f7f906c941`.
- Safe planning boundary exists as source only:
  - `POST /repair-intake/drafts/:draftId/case/plan`
- The safe planning boundary is not mounted to app/server by this task.
- No submit route exists in the Task1891 safe boundary.
- No formal Case creation exists in the Task1891 safe boundary.
- No draft-to-formal-Case linking exists in the Task1891 safe boundary.
- No Case persistence exists in the Task1891 safe boundary.
- No DB, migration, seed, or route smoke has been run for this branch.
- No provider sending has been run.
- No Zeabur route smoke has been run.

## Preconditions Before Task1894 Can Run

- The exact approved target URL must be named by the user or PM.
- Route mount status must be explicitly confirmed before any route smoke.
- If the route is unmounted, Task1894 must not expect public route success.
- If smoke requires a DB-backed path, the DB/migration/seed target must be named and approved separately.
- Provider sending must remain disabled.
- Formal Case creation remains forbidden unless a later task explicitly authorizes it.
- Draft-to-formal-Case linking remains forbidden unless a later task explicitly authorizes it.
- Submit route smoke remains forbidden unless a later task creates and scopes it.
- Completion Report / Field Service Report behavior remains forbidden.
- `finalAppointmentId` mutation remains forbidden.
- Customer-visible publication behavior remains forbidden.

## Allowed Future Smoke Categories

- Public `/healthz` smoke.
- Unmounted route expectation check.
- Mounted safe preflight route safe-deny check.
- Synthetic local handler smoke only if explicitly scoped.
- DB-backed smoke only after DB target approval.
- Authenticated allow-path smoke only after target and test data approval.

## Forbidden Future Smoke Actions Without Explicit Approval

- Formal Case creation.
- Draft-to-Case submit.
- Draft-to-formal-Case linking.
- Draft merge.
- Provider sending.
- LINE/SMS/email/app push.
- AI/RAG provider calls.
- Billing provider calls.
- Destructive fixture smoke.
- Seed and migration in the same smoke task.
- Printing `DATABASE_URL`, tokens, provider keys, passwords, private keys, passphrases, or secrets.
- Completion Report / Field Service Report creation, approval, publication, revocation, or mutation.
- `finalAppointmentId` mutation.
- Customer-visible publication behavior.

## Stop Conditions

Stop immediately if any future smoke observes or requires:

- Route unexpectedly creates a formal Case.
- Route unexpectedly links a draft to a formal Case.
- Route bypasses the duplicate candidate guard.
- Route bypasses the contact-role DTO guard.
- Route exposes raw draft rows, raw phone/address, tokens, SQL, stack traces, provider payloads, billing internals, AI output, or secrets.
- Route provider-sends.
- Route reaches customer-visible publication behavior.
- Route creates, mutates, approves, publishes, or revokes Completion Report / Field Service Report behavior.
- Route mutates `finalAppointmentId`.
- Route status/envelope does not match expected safe-deny or safe-preflight behavior.

## Exact Task1894 Approval Phrase

Task1894 must not run until the user provides an explicit approval using this shape:

> I approve running Repair Intake route smoke against the explicitly named target: `<TARGET_NAME>`. Do not use any other target. Do not run DB/migration/seed. Do not create/link formal Case. Do not trigger provider sending, AI, billing, Completion Report / FSR behavior, finalAppointmentId mutation, or customer-visible publication.

## Recommended Task1894 Shape

- Start with `/healthz` only.
- Run route mount/safe-deny check only if the route is mounted.
- Do not run authenticated allow-path smoke until target and test data are approved.
- Do not run DB-backed smoke unless the DB target is explicitly approved.
- Do not run migration or seed in the smoke task.
- Do not execute provider sending, AI/RAG, billing, Completion Report / FSR, `finalAppointmentId`, or customer-visible publication behavior.

## Verification Summary

- Documentation-only readiness task.
- No runtime source changes.
- No test changes.
- No package or lockfile changes.
- No DB, SQL, migration, seed, smoke, Zeabur probe, deploy, provider, AI, billing, formal Case, draft link, Completion Report / FSR, `finalAppointmentId`, or customer-visible publication action was performed.
