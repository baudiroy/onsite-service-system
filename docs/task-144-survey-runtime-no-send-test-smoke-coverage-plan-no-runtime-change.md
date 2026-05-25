# Task 144 - Survey Runtime No-send Test / Smoke Coverage Plan / No Runtime Change

## Background

Task144 designs future no-send test and smoke coverage for survey runtime. It does not implement tests, run migrations, connect to DB, or enable survey delivery.

This task covers how future tests should verify the write-path contracts from Tasks137-143 while preserving no-send, channel-agnostic, no-AI, no-destructive-cleanup boundaries.

## No-runtime-change Statement

Task144 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify smoke or browser smoke scripts,
- add tests,
- edit Migration 020,
- add or apply migrations,
- execute DDL,
- connect to DB,
- run psql,
- run `npm run db:migrate`,
- change schema or indexes,
- implement repositories,
- implement services,
- implement feature flags,
- change config or env parsing,
- change API behavior,
- create survey intents,
- create outbox events,
- start outbox workers,
- start delivery resolvers,
- send LINE / APP / SMS / email notifications,
- implement response intake,
- implement AI runtime,
- modify Task087 inventory docs,
- mutate shared runtime data.

## Source Review Summary

Reviewed:

- `docs/task-143-survey-first-completion-service-contract-no-runtime-change.md`
- `docs/task-142-event-outbox-repository-contract-no-runtime-change.md`
- `docs/task-141-survey-intent-repository-contract-no-runtime-change.md`
- `docs/task-140-survey-runtime-transaction-boundary-recovery-model-no-runtime-change.md`
- `docs/task-139-survey-runtime-payload-allow-list-redaction-contract-no-runtime-change.md`
- `docs/task-137-survey-runtime-feature-flag-kill-switch-contract-no-runtime-change.md`
- `migrations/020_create_survey_intents_and_event_outbox.sql`
- `src/services/FieldServiceReportService.js`
- `scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js`
- `scripts/smoke/029_single_open_appointment_guard_smoke.js`
- `scripts/smoke/browser/071_multi_dispatch_browser_smoke.js`
- `package.json`

## Current Test / Smoke Coverage Review

Current useful coverage:

1. `smoke:028` covers multi-dispatch finalAppointmentId guards, backend inference, no completed appointment rejection, supplied id validation, deterministic final appointment selection, repeat completion conflict, and stable finalAppointmentId / completed timestamps.
2. `smoke:029` covers the single-open-appointment invariant and safe error redaction checks.
3. `smoke:071:browser` covers Admin completion omitting finalAppointmentId, backend inference through the Admin UI, final marker display, no manual picker, and no eligible completed visit error path.
4. `npm run check` is syntax-only for backend `src/**/*.js`.
5. `npm run admin:check` runs Admin TypeScript check.
6. No current smoke assumes survey tables exist.
7. No current smoke verifies survey rows, because Migration 020 is authored but not applied and survey runtime is not implemented.
8. Future survey no-send assertions should use a focused smoke after runtime implementation rather than overloading every existing smoke path.

## Test Taxonomy

Future coverage should be split by risk and blast radius:

1. Unit tests:
   - feature flag guard,
   - payload allow-list builder,
   - idempotency key builder,
   - `SurveyFirstCompletionService` no-op behavior,
   - repository input validation contract,
   - no raw sensitive fields.

2. Repository tests:
   - `SurveyIntentRepository` insert,
   - `EventOutboxRepository` insert,
   - unique conflict handling,
   - transaction client required,
   - no forbidden fields stored,
   - no fallback to pool.

3. Service integration tests:
   - `FieldServiceReportService` + `SurveyFirstCompletionService` contract,
   - strict atomic rollback,
   - no-survey paths,
   - flags disabled.

4. Backend smoke tests:
   - no-send first completion write path after future implementation,
   - repeat completion creates no survey rows,
   - rejected completion creates no survey rows,
   - no eligible completed visit creates no survey rows,
   - no outbound signals.

5. Browser smoke tests:
   - Admin UI does not send survey payload,
   - Admin UI has no manual send / resend,
   - Admin completion behavior unchanged,
   - survey internal rows are not exposed unless a future safe API contract exists.

6. Static safety tests:
   - forbidden schema fields absent,
   - forbidden payload keys absent,
   - logs / output do not include sensitive values,
   - no provider call mocks invoked.

## Future Unit Test Plan

Feature flag tests:

1. All flags default false.
2. Missing flag = false.
3. Invalid flag = false.
4. `SURVEY_RUNTIME_ENABLED=false` blocks all survey runtime.
5. `SURVEY_DELIVERY_SENDING_ENABLED=false` blocks all outbound.
6. Channel flag true without sending master still causes no outbound.

Payload tests:

1. `safe_context_summary` accepts only allow-listed keys.
2. `event_outbox.payload` accepts only allow-listed keys.
3. Unknown key fails closed.
4. Raw LINE user id is rejected.
5. Customer mobile is rejected.
6. Provider payload is rejected.
7. Full report/customer/appointment payload is rejected.
8. AI output is rejected.
9. Future worker `last_error` sanitizer strips/truncates unsafe content.

Idempotency tests:

1. Deterministic key uses caseId + serviceReportId.
2. finalAppointmentId is not in key.
3. completedAt is not in key.
4. Channel is not in key.
5. Actor identity is not in key.

Service no-op tests:

1. Flags disabled returns no-op.
2. No repository calls when disabled.
3. No sending calls ever.

## Future Repository Test Plan

`SurveyIntentRepository` tests:

1. Requires transaction client.
2. Does not open its own transaction.
3. Inserts expected safe fields.
4. Unique org + idempotency conflict surfaces safely.
5. Unique org + case + report conflict surfaces safely.
6. No raw sensitive fields accepted.
7. `final_appointment_id` nullable is handled only under explicit legacy policy.
8. Status update methods remain deferred.

`EventOutboxRepository` tests:

1. Requires transaction client.
2. Does not open its own transaction.
3. Inserts canonical event type.
4. Inserts status `pending`.
5. Inserts `attempts = 0`.
6. Inserts lock fields as null.
7. Inserts `last_error = null`.
8. Unique org + event type + idempotency conflict surfaces safely.
9. No provider delivery fields accepted.
10. Worker methods are not part of first-write contract.

## Future Service Integration Test Plan

Future integration tests:

1. First successful completion with flags enabled creates exactly one `survey_intent` and one `event_outbox`.
2. Both rows share the same idempotency key.
3. Both rows use canonical event name `case.service_completion.first_transitioned`.
4. Both rows are committed atomically.
5. SurveyIntent insert failure rolls back report/case completion under strict atomic model.
6. EventOutbox insert failure rolls back survey intent and report/case completion under strict atomic model.
7. Flags disabled preserves current completion behavior and creates no rows.
8. Repeat completion 409 creates no rows.
9. No eligible completed visit rejection creates no rows.
10. Cross-case finalAppointmentId rejection creates no rows.
11. Non-completed finalAppointmentId rejection creates no rows.
12. Failed transaction creates no rows.
13. Legacy no-appointment policy disabled creates no rows.
14. No outbound provider calls occur.
15. No resolver / worker calls occur.

## Future Backend Smoke Coverage Plan

Recommended future smoke after runtime implementation:

```text
scripts/smoke/030_survey_first_completion_no_send_smoke.js
```

Do not create it in Task144.

Future backend smoke should verify:

1. Flags disabled -> existing completion still works and no survey rows are created.
2. Flags enabled in local/test only -> first completion creates one intent and one outbox row.
3. No survey sending occurs.
4. Repeat completion creates no extra rows.
5. No eligible completed visit creates no rows.
6. `event_outbox.status = pending`.
7. No provider fields are stored.
8. No raw LINE id / mobile / payload appears in output.
9. No shared runtime real outbound occurs.
10. Smoke output uses safe summaries only.

Safety notes:

- Shared Zeabur smoke must not enable real sending.
- Local/test-only survey write smoke requires Migration 020 applied.
- No destructive cleanup.
- Any future survey smoke fixture cleanup must follow a separately approved policy and must not mutate shared runtime destructively.

## Future Browser Smoke Coverage Plan

Future browser assertions:

1. Admin completion still omits finalAppointmentId.
2. Admin does not send survey fields.
3. No manual survey send / resend button is visible.
4. No manual finalAppointmentId picker is visible.
5. Completion success UI remains unchanged.
6. If future Admin survey visibility flag is disabled, no survey UI is visible.
7. If future visibility is enabled, only read-only safe summary is visible.
8. No raw LINE id / mobile / provider payload appears in DOM.
9. No survey sending starts from browser.
10. No runtime override controls are exposed.

Do not implement browser smoke in Task144.

## No-send Assertions

All future test levels should assert no-send by checking:

1. LINE client not called.
2. APP push client not called.
3. SMS/email provider not called.
4. Notification sender not called.
5. Delivery resolver not called in write-path tests.
6. Outbox worker not started.
7. `notification_logs` not created by first-completion write path.
8. Provider payload not generated.
9. No channel adapter loaded if avoidable.
10. No outbound credentials required.

## Shared Runtime Safety

Rules:

1. Survey write-path tests requiring Migration 020 should run local/test only.
2. Shared Zeabur must not run survey sending tests.
3. Shared Zeabur must not run destructive cleanup.
4. Shared runtime survey tests, if ever allowed, must be read-only or no-send and explicitly approved.
5. No raw production data in smoke output.
6. No `DATABASE_URL` output.
7. No customer mobile / raw LINE id / full payload output.

## Test Output Safety

Allowed output:

- pass/fail counts,
- table existence summary,
- safe row counts,
- event type presence,
- status values,
- idempotency conflict count,
- masked ids if needed,
- no-send confirmation.

Forbidden output:

- `DATABASE_URL`,
- secrets,
- customer contact,
- raw LINE user id,
- full payload,
- full feedback text,
- provider payload,
- raw request / response,
- production data.

## Coverage Matrix

| Scenario | Unit test | Repository test | Service integration test | Backend smoke | Browser smoke | Requires Migration 020 applied? | Requires runtime implementation? | Requires local/test only? | No-send assertion | Sensitive output risk | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Flags disabled | Yes | No | Yes | Yes | Optional | No | Yes | No | Yes | Low | Existing completion behavior preserved. |
| First completion with flags enabled | Yes | Yes | Yes | Yes | Optional | Yes | Yes | Yes | Yes | Medium | Verify exactly one intent/outbox. |
| Repeat completion | Yes | Optional | Yes | Yes | Optional | Yes | Yes | Yes | Yes | Low | Must create no rows. |
| No eligible completed visit | Yes | No | Yes | Yes | Already covered for UI error path | Yes for row checks | Yes | Yes | Yes | Low | Existing completion rejection stays. |
| Cross-case finalAppointmentId | Optional | No | Yes | Existing smoke 028 remains useful | No | Yes for row checks | Yes | Yes | Yes | Low | Must create no rows. |
| Non-completed finalAppointmentId | Optional | No | Yes | Existing smoke 028 remains useful | No | Yes for row checks | Yes | Yes | Yes | Low | Must create no rows. |
| EventOutbox insert failure | Yes | Yes | Yes | Optional | No | Yes | Yes | Yes | Yes | Medium | Strict atomic rollback. |
| SurveyIntent insert failure | Yes | Yes | Yes | Optional | No | Yes | Yes | Yes | Yes | Medium | No outbox insert. |
| Payload forbidden key | Yes | Yes | Yes | Optional | Optional | No for builder tests | Yes | Yes | Yes | High | Fail closed before DB insert. |
| Idempotency conflict | Yes | Yes | Yes | Optional | No | Yes | Yes | Yes | Yes | Medium | No overwrite / duplicate. |
| Legacy no-appointment policy disabled | Yes | No | Yes | Optional | No | Yes for row checks | Yes | Yes | Yes | Low | Policy decision remains explicit. |
| Admin completion unchanged | Optional | No | Optional | No | Yes | No | Maybe | No | Yes | Low | No survey payload in Admin request. |
| No manual survey send UI | No | No | No | No | Yes | No | Future Admin feature only | No | Yes | Low | Ensure no hidden override. |
| No raw sensitive data output | Yes | Yes | Yes | Yes | Yes | No | Yes | Yes | Yes | High | Applies across all future tests. |

## Remaining Blockers

Before any future survey runtime test implementation:

- Migration 020 apply approval and local/test environment decision.
- Runtime implementation approval.
- Feature flag implementation.
- Payload allow-list implementation.
- `SurveyIntentRepository` implementation.
- `EventOutboxRepository` implementation.
- `SurveyFirstCompletionService` implementation.
- No-send smoke fixture strategy.
- Decision on legacy no-appointment policy.
- Decision on whether future worker methods exist before or after first no-send smoke.

## Final Recommendation

Future test rollout should start with unit and repository tests, then service integration tests for strict atomic behavior, and only then a focused local/test backend no-send smoke such as `smoke:030`. Browser smoke should remain focused on Admin contract safety: no survey payload, no manual send/resend, and no internal survey data exposure unless a future safe Admin read-only API exists.

Task145 should aggregate Tasks137-144 into a survey runtime implementation readiness gate and decide what must be true before any runtime code starts.

## Non-goals

Task144 does not implement tests, modify smoke, modify browser smoke, modify runtime behavior, apply Migration 020, change schema/indexes, connect to DB, create survey rows, create outbox rows, send surveys, start workers/resolvers, modify Admin UI, add AI runtime, modify inventory docs, mutate shared runtime data, or perform destructive cleanup.

## Verification Summary

Task144 verification should confirm:

- `npm run check` passes.
- `npm run admin:check` passes if executed.
- `git diff --check` passes.
- No migration file was modified.
- No migration apply occurred.
- No psql command was executed.
- `npm run db:migrate` was not executed.
- This document contains no executable DB command packet and no test implementation instruction.
- Test/smoke names are proposals only.
- This document contains no actual `DATABASE_URL` value, password, token, secret, customer mobile, raw LINE user id, LINE channel secret, LINE access token, full payload, raw payload, or production data.
