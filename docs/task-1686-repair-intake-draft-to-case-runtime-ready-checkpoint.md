# Task 1686 - Repair Intake Draft To Case Runtime Ready Checkpoint

## Status

Completed for PM review.

## Purpose

Record the current Repair Intake Draft to Case runtime-ready checkpoint after the final bounded Zeabur verification pass.

This is a docs-only checkpoint. It does not change runtime behavior, schema, tests, package files, admin UI, provider settings, or deployment configuration.

## Current Readiness Summary

- Migration 026 is treated as applied for the current Zeabur runtime path.
- Admin Draft to Case protected route feature flag and server startup wiring are committed.
- Runtime ports factory wiring is committed and remains disabled by default unless explicitly feature-flagged.
- Zeabur production-like, admin route, server-startup, route flow, replay, denied, not-found, and already-converted smokes passed.
- Final Zeabur smoke subset result: PASS (8/0).
- Related app/server/route/app-service/idempotency/draft/case unit subset result: PASS (212/0).
- `npm run check`: PASS.
- Credential pattern scan across related production-like/server/admin smoke plus server/app files: clean.
- Working tree after Task1685 remained clean for staged and tracked diffs, with only the 7 held historical docs untracked.

## Final Verification Evidence

Latest Task1685 results:

```text
DATABASE_URL from clipboard node --test final Zeabur runtime smoke subset: PASS (8 tests, 0 fail)
node --test related app/server/route/app-service/idempotency/draft/case unit subset: PASS (212 tests, 0 fail)
npm run check: PASS
credential pattern scan across related production-like/server/admin smoke + server/app files: clean
git diff --cached --name-only: empty
git diff --name-only: empty
git status --short: only 7 held historical docs untracked
```

Final Zeabur smoke subset:

```text
tests/repairIntake/repairIntakeDraftToCaseAdminRouteProductionLikeZeabur.smoke.test.js
tests/repairIntake/repairIntakeServerDraftToCaseZeabur.smoke.test.js
tests/repairIntake/repairIntakeDraftToCaseAdminRouteZeabur.smoke.test.js
tests/repairIntake/repairIntakeDraftToCaseZeaburRouteFlow.smoke.test.js
tests/repairIntake/repairIntakeDraftToCaseZeaburRouteReplay.smoke.test.js
tests/repairIntake/repairIntakeDraftToCaseZeaburRouteDenied.smoke.test.js
tests/repairIntake/repairIntakeDraftToCaseZeaburRouteNotFound.smoke.test.js
tests/repairIntake/repairIntakeDraftToCaseZeaburRouteAlreadyConverted.smoke.test.js
```

## Committed Runtime Readiness Pieces

- Runtime ports factory for injected DB-backed Draft to Case ports.
- App factory option wiring that builds runtime ports only when enabled and dependencies are injected.
- Server startup resolution wiring that passes feature-flagged DB-backed options into `createApp`.
- Server-startup Zeabur smoke.
- Production-like protected admin route Zeabur smoke covering happy, denied, and not-found paths.
- Runtime readiness checkpoint documentation.

## Explicit Non-goals

- No DB action in Task1686.
- No migration, DDL, SQL dry-run, or `psql`.
- No `npm run db:migrate`.
- No source code change.
- No test change.
- No migration file change.
- No package or lockfile change.
- No admin UI change.
- No real `app.listen`.
- No provider sending.
- No LINE/SMS/email/webhook/App push.
- No AI/RAG call.
- No billing or settlement runtime.
- No customer-visible rollout.
- No credential, token, secret, or DB URL exposure.
- No staging.
- No commit.
- No push.

## Readiness Boundary

This checkpoint records that the bounded Repair Intake Draft to Case runtime path is ready from the current backend verification perspective: feature-flagged admin route wiring, server startup resolution, DB-backed runtime ports, Zeabur persistence, replay/denied/not-found/already-converted protections, and cleanup behavior have all passed the bounded verification set.

It does not authorize broader rollout, customer-visible enablement, provider sending, admin UI expansion, schema changes, migration work, AI/RAG, billing/settlement, or any unbounded smoke/shared runtime task. Any next step should remain PM-approved and bounded.
