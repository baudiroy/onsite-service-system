# Task 156 - First-Transition Runtime Hardening Verification / Browser Regression Review

## Background

Task156 verifies Task155 first-transition runtime hardening and diagnoses the `smoke:071:browser` timeout observed during Task155 verification.

This task does not add migration, schema changes, survey runtime, survey sending, Admin manual picker, or inventory-doc changes.

## No-runtime-change Statement

Task156 makes no backend runtime change and no Admin frontend change.

It records verification and environment diagnosis only.

Task156 does not:

- add migration,
- modify schema or indexes,
- apply Migration 020,
- run Migration 020 dry-run,
- run `npm run db:migrate`,
- use psql,
- connect to shared DB for verification,
- implement survey runtime,
- write survey intents or event outbox rows,
- start survey delivery,
- modify inventory docs,
- perform destructive cleanup,
- expose sensitive values.

## Files Changed

- `docs/task-156-first-transition-runtime-hardening-verification-browser-regression-review.md`

No backend code was changed in Task156.

No Admin frontend code was changed in Task156.

No smoke script was changed in Task156.

## Task155 Backend Regression Review

Task155 remains aligned with the intended first-transition hardening contract:

- `getServiceReportByIdForUpdate()` performs a row lock inside the completion transaction.
- `completeServiceReportFirstTransition()` uses a completion-specific conditional update with `service_status <> 'completed'`.
- The service rejects already-completed reports before finalAppointmentId inference / mutation.
- Successful first-transition row gates Case update, timeline, and audit side effects.
- Conditional update returning no row is treated as conflict before side effects.
- Generic service report update behavior is not used for completion first-transition.
- finalAppointmentId resolution order remains Task106-compatible.
- supplied same-Case completed finalAppointmentId remains accepted before first completion.
- completed report finalAppointmentId cannot be overwritten after completion.

## Smoke 028 Result

`npm run smoke:028` passed after starting the local backend server and running with local API access allowed.

Result:

- 19 passed / 0 failed.

Coverage confirmed:

- omitted finalAppointmentId backend inference,
- deterministic latest completed visit selection,
- no eligible completed visit rejection,
- supplied same-Case completed finalAppointmentId compatibility,
- cross-Case finalAppointmentId rejection,
- pending-parts final appointment rejection,
- repeat completion conflict,
- completed report cannot be reopened,
- repeat supplied finalAppointmentId cannot override completed report,
- concurrent completion produces exactly one success and one conflict,
- concurrent losing request does not create duplicate completion timeline message.

## Smoke 029 Result

`npm run smoke:029` passed after starting the local backend server and running with local API access allowed.

Result:

- 12 passed / 0 failed.

Coverage confirmed:

- one-open-appointment service guard remains intact,
- terminal appointment result allows next appointment,
- service report completion with supplied same-Case completed appointment remains accepted,
- one Case still completes through one formal Field Service Report.

## Browser Smoke 071 Diagnosis

Initial `npm run smoke:071:browser` failed before Admin Vite was running.

After starting Admin Vite without `VITE_API_BASE_URL`, browser smoke preflight and fixture creation could run, but the browser UI timed out waiting for `case-detail-panel`.

Diagnosis:

- `admin/vite.config.ts` does not define a `/api` proxy.
- Admin frontend needs `VITE_API_BASE_URL=http://localhost:3000` for local browser smoke.
- Without that env value, UI login / authenticated API calls can fail or remain ineffective in the browser page.
- The case detail timeout was an environment setup issue, not a Task155 backend regression.
- No selector or route change was required.
- No Admin frontend patch was required.
- No browser smoke script patch was required.

After restarting Admin Vite with:

```text
VITE_API_BASE_URL=http://localhost:3000 npm --prefix admin run dev -- --host 127.0.0.1 --port 5173
```

`npm run smoke:071:browser` passed with local browser/API access allowed.

Result:

- 13 passed / 0 failed.

Coverage confirmed:

- Admin completion request omits finalAppointmentId,
- backend inference completion succeeds,
- response contains resolved finalAppointmentId,
- final marker still appears,
- no manual picker appears,
- no eligible completed visit completion is rejected safely,
- rejected completion leaves report in progress,
- rejected completion leaves Case not completed / not closed,
- no final marker appears on rejected completion.

## Admin Completion Contract

Task156 confirms Admin behavior remains:

- completion payload omits finalAppointmentId,
- no manual final appointment picker,
- no operator override,
- final marker is driven by response / refreshed report data,
- no eligible completed visit rejection stays safe.

## Verification Commands

Executed:

```text
npm run check
node --check scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js
npm run admin:check
node --check scripts/smoke/browser/071_multi_dispatch_browser_smoke.js
git diff --check
npm run smoke:028
npm run smoke:029
npm run smoke:071:browser
```

Notes:

- Initial smoke runs without a local backend failed with `fetch failed`.
- Initial browser smoke without Admin Vite failed preflight.
- Browser smoke with Admin Vite but missing `VITE_API_BASE_URL` reproduced the case detail timeout.
- Browser smoke passed after Admin Vite was restarted with the correct local API base URL.
- These were execution-environment setup issues, not product or runtime regressions.

## Safety Review

Task156 report and verification output did not include:

- database URL values,
- credentials,
- tokens,
- secrets,
- customer mobile values in handoff,
- raw LINE user ids,
- raw payloads,
- production data details.

## Final Conclusion

Task155 can be treated as verified for the current local test scope:

- backend hardening passed static checks,
- first-transition concurrent completion smoke passed,
- one-open-appointment smoke passed,
- Admin browser smoke passed after correct local frontend environment setup,
- no backend follow-up patch is required from Task156,
- no Admin frontend patch is required from Task156,
- no browser smoke patch is required from Task156.

## Next Task Recommendation

Recommended Task157:

`Task 157 - First-Transition Hardening Closure / Product Mainline Return Recommendation`

Suggested scope:

- documentation-only closure,
- mark Task153 through Task156 first-transition hardening line as completed for current runtime scope,
- keep Migration 020 paused,
- keep survey runtime unimplemented,
- recommend returning to product mainline design such as existing case reverse LINE binding or channel abstraction,
- no runtime change,
- no migration,
- no schema/index change,
- no inventory docs expansion.
