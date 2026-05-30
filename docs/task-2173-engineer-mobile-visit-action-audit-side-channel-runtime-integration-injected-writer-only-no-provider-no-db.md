# Task2173 Engineer Mobile Visit Action Audit Side-Channel Runtime Integration

Status: completed.

## Scope

This task adds optional injected audit side-channel integration only to the Engineer Mobile visit action boundary:

- `POST /engineer-mobile/appointments/:appointmentId/actions/:action`

No task list audit behavior change, task detail audit behavior change, route-registration audit integration, provider sending, DB, migration, SQL, env, Zeabur, smoke, server/listener, Customer Access, admin, AI, billing, package, or public app route work was performed.

## Changed Files

- `src/routes/engineerMobileVisitActionRoutes.js`
- `tests/engineerMobile/engineerMobileVisitActionRoute.unit.test.js`
- `docs/task-2173-engineer-mobile-visit-action-audit-side-channel-runtime-integration-injected-writer-only-no-provider-no-db.md`

The visit action final response boundary is in `src/routes/engineerMobileVisitActionRoutes.js`, where the route resolves the appointment, invokes the HTTP handler adapter, and writes the HTTP response.

## Audit Writer Injection Shape

The visit action route options now accept an optional:

```js
{
  auditWriter(auditEvent) {}
}
```

Only a function-valued `auditWriter` is supported. Missing, object-shaped, or otherwise malformed `auditWriter` values are skipped and do not change visit action behavior.

There is no global fallback writer, provider writer import, DB writer import, env writer import, or runtime persistence activation.

## Audit Events

Allow event:

- `eventType`: `engineer_mobile.visit_action.allow`
- `route`: `/engineer-mobile/appointments/:appointmentId/actions/:action`
- `method`: `POST`
- `source`: `engineer_mobile_visit_action_handler`
- `decision`: `allow`
- `appointmentId`: safe route param only
- `action`: Task2167 allowlisted route param only
- `reasonCode`: omitted
- `metadata`: `routeMatched`, `contextPresent`, `identifierValid`, `permissionPassed`, `actionAllowed`

Deny event:

- `eventType`: `engineer_mobile.visit_action.deny`
- `route`: `/engineer-mobile/appointments/:appointmentId/actions/:action`
- `method`: `POST`
- `source`: `engineer_mobile_visit_action_handler`
- `decision`: `deny`
- `appointmentId`: safe route param only when available
- `action`: Task2167 allowlisted route param only when available
- `reasonCode`: `engineerMobile.unavailable`
- `metadata`: `routeMatched`, `contextPresent`, `identifierValid`, `permissionPassed`, `actionAllowed`

Events are built through `buildEngineerMobileAuditEvent` and written through `writeEngineerMobileAuditEvent`.

## Call And Skip Behavior

- Valid allow/action response with function `auditWriter`: one audit write is attempted.
- Permission deny response with function `auditWriter`: one deny audit write is attempted when the action is safe/allowlisted.
- Handler safe-deny/unavailable response with function `auditWriter`: one deny audit write is attempted when the action is safe/allowlisted.
- Invalid or non-allowlisted action: the builder rejects the audit event, the writer is skipped, and the engineer-facing response remains unchanged.
- Missing or malformed `auditWriter`: no audit write is attempted.
- Invalid audit event builder result: no audit write is attempted.
- Writer throw, reject, or malformed result: request handling continues and the engineer-facing response is unchanged.

Audit write results are not added to response bodies or headers.

## Non-Leakage

The audit event contains only Task2167 accepted audit event keys and safe metadata keys. It does not include raw request, response, headers, authorization, cookies, tokens, body, query object, params object, raw auth/session/access objects, raw visit action service results, raw appointment details beyond safe identifiers, DB rows/query metadata, provider payloads, AI prompts/responses, debug, stack, SQL, internal/private/admin-only fields, completion report private body, engineer private notes, or customer private notes.

## Verification

- `node --test tests/engineerMobile/engineerMobileVisitActionRoute.unit.test.js`: PASS, 17/17
- `node --test tests/engineerMobile/engineerMobileVisitActionInjectedMountAdapter.unit.test.js`: PASS, 12/12
- `node --test tests/engineerMobile/engineerMobileRoute.unit.test.js tests/engineerMobile/engineerMobileTaskDetailRoute.unit.test.js`: PASS, 31/31
- `node --test tests/engineerMobile/engineerMobileAuditEventBuilder.unit.test.js tests/engineerMobile/engineerMobileAuditWriterAdapter.unit.test.js tests/engineerMobile/engineerMobileAuditWriterResultNormalizer.unit.test.js`: PASS, 31/31
- `node --test tests/engineerMobile/engineerMobileProductionMountCompositionAdapter.unit.test.js`: PASS, 7/7

Additional checks before commit:

- `git diff --check`
- `git status --short --branch`
