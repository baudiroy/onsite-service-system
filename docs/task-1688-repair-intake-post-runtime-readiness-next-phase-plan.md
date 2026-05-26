# Task 1688 - Repair Intake Post Runtime Readiness Next Phase Plan

## Status

Completed for PM review.

## Purpose

Provide a short PM decision document for what to do after the Repair Intake Draft to Case admin runtime path reached bounded backend readiness.

This document is planning only. It does not enable rollout, change runtime, change tests, touch DB, change schema, or modify admin UI.

## Current Readiness Baseline

- Repair Intake Draft to Case admin runtime is ready behind the feature flag.
- Feature flag and server startup wiring are committed.
- Runtime ports factory, app option wiring, and server startup resolution are committed.
- Zeabur production-like, admin, server-startup, route flow, replay, denied, not-found, and already-converted smokes passed.
- Final Zeabur runtime smoke subset passed: 8/0.
- Related app/server/route/app-service/idempotency/draft/case unit subset passed: 212/0.
- `npm run check` passed.
- Credential scan was clean.
- No customer-visible rollout has happened.
- No real `app.listen` production enablement was performed during the readiness tasks.
- Existing 7 held historical docs remain untracked and were not staged or cleaned.

## Next-Phase Decision Options

### Option A - Enable Admin Route In Non-prod Zeabur

Enable the protected admin Draft to Case route in a non-production Zeabur environment using the existing feature flag, then run a real app smoke against the deployed route.

Use when PM wants to validate deployed runtime behavior before any admin UI work.

Expected next bounded task shape:

- configure non-prod Zeabur feature flag only,
- do not change schema,
- do not run migrations,
- do not expose customer-visible routes,
- run authenticated admin route smoke through real deployed app,
- verify rows and cleanup,
- keep credential output suppressed.

### Option B - Add Admin UI Trigger

Add an admin UI action that lets an authorized internal user submit a ready Repair Intake draft into a Case through the protected admin route.

Use when PM wants staff-facing workflow integration after backend route readiness.

Expected next bounded task shape:

- stay inside admin UI scope,
- call existing protected admin endpoint,
- require `cases.create`,
- show safe success/failure states,
- no customer-visible rollout,
- no schema or migration work.

### Option C - Pause Repair Intake And Shift To Engineer Mobile

Pause the Repair Intake Draft to Case branch at the current ready checkpoint and move bounded runtime work to Engineer Mobile.

Use when PM wants to return to field execution workflow after preserving Repair Intake readiness.

Expected next bounded task shape:

- no Repair Intake source changes,
- no admin route enablement,
- no DB schema work,
- select the next Engineer Mobile bounded runtime task separately.

## Recommended PM Decision

If the goal is to prove deployment readiness before UI work, choose Option A first.

If non-prod deployed route behavior is already trusted and the next product value is operator workflow, choose Option B.

If Repair Intake should stop at backend readiness for now, choose Option C.

## Explicit Non-goals

- No source code change.
- No test change.
- No migration change.
- No package or lockfile change.
- No server runtime change.
- No admin UI change.
- No DB action.
- No feature flag enablement.
- No Zeabur configuration change.
- No provider sending.
- No LINE/SMS/email/webhook/App push.
- No AI/RAG call.
- No billing or settlement runtime.
- No customer-visible rollout.
- No staging.
- No commit.
- No push.
