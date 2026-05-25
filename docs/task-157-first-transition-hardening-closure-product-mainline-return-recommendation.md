# Task 157 - First-Transition Hardening Closure / Product Mainline Return Recommendation

## Background

Task157 closes the Field Service Report first-transition hardening line from Task153 through Task156 and recommends returning to a safe product-mainline design branch.

This task is documentation-only. It does not change runtime, apply migrations, enable survey behavior, or expand inventory docs.

## No-runtime-change Statement

Task157 does not:

- modify backend `src/`,
- modify Admin frontend `admin/src/`,
- modify smoke or browser smoke scripts,
- add tests,
- add migration,
- change schema or indexes,
- apply Migration 020,
- dry-run Migration 020,
- connect to DB,
- use psql,
- run `npm run db:migrate`,
- implement survey runtime,
- write survey intents or event outbox rows,
- start outbox workers,
- start delivery resolvers,
- send survey,
- send LINE / APP / SMS / email,
- add AI automatic decisions,
- modify inventory docs,
- perform destructive cleanup,
- mutate shared runtime data,
- output sensitive values.

## Source Review Summary

Task157 relies on the completed evidence from:

- Task153 first-transition concurrency hardening review,
- Task154 first-transition conditional update implementation plan,
- Task155 first-transition runtime hardening implementation,
- Task156 verification and browser regression review.

No new runtime investigation was needed because Task156 already completed the required smoke and browser verification.

## Task153 To Task156 Closure Summary

### Task153 Finding

Task153 confirmed:

- repeat completion after an already-completed report was guarded by Task109,
- strict concurrent first-transition protection was still missing,
- `getServiceReportById()` used a plain read,
- generic `updateServiceReport()` did not require `service_status <> 'completed'`,
- future survey runtime would need a stronger first-transition boundary.

### Task154 Plan

Task154 recommended:

- Option C as the target: row lock plus completion-specific conditional update,
- no migration,
- no schema/index change,
- no survey runtime,
- no Admin frontend contract change,
- future side effects gated after a successful first-transition row.

### Task155 Implementation

Task155 implemented:

- `getServiceReportByIdForUpdate()` using `FOR UPDATE`,
- `completeServiceReportFirstTransition()` using `service_status <> 'completed'`,
- `completeServiceReport()` locked read before inference / mutation,
- already-completed conflict before side effects,
- Case update / timeline / audit only after the first-transition update returns a row,
- concurrent completion smoke coverage in `smoke:028`.

### Task156 Verification

Task156 confirmed:

- `npm run smoke:028`: PASS, 19 passed / 0 failed,
- `npm run smoke:029`: PASS, 12 passed / 0 failed,
- `npm run smoke:071:browser`: PASS, 13 passed / 0 failed after correct local Admin Vite API-base setup,
- the earlier browser timeout was local environment setup, not a Task155 regression,
- no Admin patch was needed,
- no browser smoke patch was needed.

## Strengthened Invariants

The current runtime now strengthens these invariants:

1. Completed report repeat completion returns conflict.
2. Near-concurrent completion for the same report allows exactly one successful first transition.
3. Losing concurrent completion requests do not update report or Case state.
4. Losing concurrent completion requests do not create duplicate completion timeline messages.
5. Losing concurrent completion requests do not create duplicate audit side effects through the completion path.
6. finalAppointmentId stays stable after completion.
7. report `onsiteCompletedAt` stays stable after repeat / losing completion.
8. Case `completedAt` stays stable after repeat / losing completion.
9. Case completion happens once for the first successful completion transition.
10. supplied finalAppointmentId compatibility remains available before first completion.
11. supplied finalAppointmentId cannot override a completed report.
12. Admin completion payload continues to omit finalAppointmentId.
13. Admin has no manual final appointment picker.
14. No survey artifacts are created by completion.
15. Migration 020 remains paused.

## Remaining Future Risks

These are non-blocking follow-ups and not Task157 scope:

1. One-open-appointment remains a service-level guard, not a DB-level concurrency constraint.
2. Case / appointment create-reschedule concurrency may need its own hardening line before high-concurrency deployment.
3. Future survey runtime must still depend only on the first successful Field Service Report / Case completion transition.
4. Strict atomic survey write model remains design-only.
5. Migration 020 is not locally dry-run and not applied.
6. Shared Migration 020 apply is not authorized.
7. Survey sending is not authorized.
8. Admin browser smoke local setup requires `VITE_API_BASE_URL=http://localhost:3000` when `admin/vite.config.ts` has no `/api` proxy.
9. Product policy remains open for reverse LINE binding, survey delivery, contact target, opt-out, channel fallback, and response retention.

## Browser Smoke Environment Note

Local Admin browser smoke requires the Admin Vite process to know the API base URL.

When `admin/vite.config.ts` does not define an `/api` proxy, start local Admin Vite with:

```text
VITE_API_BASE_URL=http://localhost:3000 npm --prefix admin run dev -- --host 127.0.0.1 --port 5173
```

The previous timeout waiting for `case-detail-panel` occurred when Admin Vite was running without that local API base URL. It was an environment setup issue, not a Task155 backend regression.

Do not modify browser smoke or Admin UI solely for that environment issue unless it recurs under the correct local setup.

## Migration 020 / Survey Pause Confirmation

Current state remains:

- Migration 020 SQL file exists.
- Migration 020 has not been locally dry-run.
- Migration 020 has not been applied.
- No DB DDL was executed for Task157.
- No `psql` was run.
- No `npm run db:migrate` was run.
- No survey runtime writes exist.
- No survey sending exists.
- No LINE / APP / SMS / email delivery exists.

General continuation language such as "continue", "go ahead", or "do the next task" is still not approval for Migration 020 dry-run, apply, shared apply, runtime survey writes, or outbound delivery.

## Product Mainline Return Recommendation

The first-transition hardening line is closed for the current runtime scope.

Recommended next branch:

`Task 158 - Existing Case Reverse LINE Binding Product Design / No Runtime Change`

Reason:

- It is a known future requirement.
- It supports current LINE entry without hard-coding LINE into Case / Report core.
- It supports cases that were not originally created from LINE.
- It supports future survey delivery after completion.
- It aligns with channel abstraction and future APP support.
- It can stay documentation-only.
- It does not require Migration 020 apply.
- It does not require DB / DDL.
- It does not require runtime/API/Admin/smoke changes.
- It avoids continuing survey runtime implementation without explicit approval.

Alternative safe product-mainline topics:

- channel abstraction core model review / no runtime change,
- Admin workflow polish planning / no runtime change,
- billing / settlement itemization design / no runtime change,
- SLA / operations risk escalation design / no runtime change.

## Non-goals

Task157 does not:

- reopen Task153 through Task156 unless a new runtime bug appears,
- start survey runtime implementation,
- start survey sending,
- apply or dry-run Migration 020,
- change completion API contract,
- reintroduce Admin-supplied finalAppointmentId,
- add manual final appointment picker,
- implement reverse LINE binding,
- implement channel delivery,
- implement AI decision-making,
- change inventory docs.

## Verification Summary

Task157 verification:

- `npm run check`: required and expected.
- `npm run admin:check`: required and expected.
- `git diff --check`: required and expected.
- sensitive scan: required and expected.

Smoke rerun is not required for Task157 because Task156 already verified:

- `smoke:028`,
- `smoke:029`,
- `smoke:071:browser`.

## Next Task Recommendation

Task158 should return to product mainline:

`Task 158 - Existing Case Reverse LINE Binding Product Design / No Runtime Change`

Suggested scope:

- design how existing Cases / Customers can bind LINE identity after Case creation,
- preserve `organization_id + line_channel_id + line_user_id` scope,
- design token / caseNo + contact verification at product-contract level,
- avoid raw LINE user id in handoff / report / survey payload,
- no API implementation,
- no migration,
- no LINE push,
- no Admin implementation,
- no survey runtime.
