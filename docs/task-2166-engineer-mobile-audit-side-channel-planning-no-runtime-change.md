# Task2166 Engineer Mobile Audit Side-Channel Planning / No Runtime Change

## Status

Task2166 is a docs-only planning packet for future Engineer Mobile audit side-channel work. It does not implement an audit builder, writer, runtime integration, production mount activation, DB persistence, provider sending, smoke, or endpoint probing.

## Current Engineer Mobile Route And Mount State

Task2165 added the Engineer Mobile production mount composition adapter skeleton:

- `src/engineerMobile/engineerMobileProductionMountCompositionAdapter.js`

Exported API:

- `createEngineerMobileProductionMountComposition(input)`
- `ENGINEER_MOBILE_PRODUCTION_MOUNT_MODULE`
- `ENGINEER_MOBILE_PRODUCTION_ROUTES`

Existing route registration boundaries used by the Task2165 adapter:

- `registerEngineerMobileRoutes(router, options)`
- `registerEngineerMobileTaskDetailRoutes(router, options)`
- `registerEngineerMobileVisitActionRoutes(router, options)`

Existing route contracts:

- `GET /engineer-mobile/tasks`
- `GET /engineer-mobile/tasks/:appointmentId`
- `POST /engineer-mobile/appointments/:appointmentId/actions/:action`

Current activation state:

- No app/server/public route activation yet.
- No production mount activation yet.
- No provider sending.
- No DB execution.
- No migration apply or dry-run.
- No smoke or endpoint probes.

## Candidate Audit Event Types

These are candidate event names only. They are not implementation authorization.

- `engineer_mobile.task_list.allow`
- `engineer_mobile.task_list.deny`
- `engineer_mobile.task_detail.allow`
- `engineer_mobile.task_detail.deny`
- `engineer_mobile.visit_action.allow`
- `engineer_mobile.visit_action.deny`
- `engineer_mobile.route_registration.success`
- `engineer_mobile.route_registration.failure`

## Future Audit Injection Points

Future audit side-channel work should use explicit injected writers only and should run after the outcome is known.

Task list HTTP boundary:

- Audit after the final allow/deny response is known.
- Do not audit before permission and identifier handling have completed.
- Do not expose the full task list response or raw read model.

Task detail HTTP boundary:

- Audit after the final allow/deny response is known.
- Use only validated route identifiers and sanitized context.
- Do not expose the full task detail response, raw appointment, customer private fields, or repository output.

Visit action HTTP boundary:

- Audit after the final allow/deny/action response is known.
- Use only validated route identifiers, safe action values, and sanitized outcome metadata.
- Do not audit raw request body, raw appointment, service result, transition payload, persistence intent, or provider payload.

Route registration boundary:

- Audit after the sanitized production mount registration summary is known.
- Use the accepted route summary only.
- Do not audit raw router, raw dependency objects, route handler functions, stack traces, or app/server objects.

Explicit placement boundaries:

- Do not put audit at the provider sending layer.
- Do not put audit inside the DB/repository layer unless a later exact task separately authorizes it.
- Do not add global writer fallback.
- Do not inspect env, Zeabur, or secrets to locate an audit writer.

## Writer Shape And Failure Behavior

Future Engineer Mobile audit writer should mirror the Customer Access side-channel style where appropriate.

Supported future writer shape:

```js
function auditWriter(auditEvent) {}
```

Allowed wrapper shapes can be considered later only if explicitly authorized:

- `{ write(auditEvent) }`
- `{ record(auditEvent) }`

Required behavior for future runtime integration:

- `auditWriter` must be optional.
- `auditWriter` must be injected only.
- No global writer fallback.
- Audit writer failure must never change engineer-facing HTTP status.
- Audit writer failure must never change engineer-facing response body.
- Audit writer throw/reject/malformed result must be contained.
- Audit result must not be added to engineer-facing responses.
- Audit must not trigger provider sending.
- Audit must not create DB connections unless a later DB-specific task authorizes it.

## Event Field Mapping Candidates

All event field names below are candidates only. They require a future exact implementation task before use.

Task list candidate fields:

- `eventType`: `engineer_mobile.task_list.allow` or `engineer_mobile.task_list.deny`
- `route`: `/engineer-mobile/tasks`
- `method`: `GET`
- `decision`: `allow` or `deny`
- `source`: `engineer_mobile_task_list_handler` or future accepted source name
- `organizationId`: sanitized context value only when safe
- `engineerId`: sanitized context value only when safe
- `requestId`: sanitized request id only when safe

Task detail candidate fields:

- `eventType`: `engineer_mobile.task_detail.allow` or `engineer_mobile.task_detail.deny`
- `route`: `/engineer-mobile/tasks/:appointmentId`
- `method`: `GET`
- `appointmentId`: validated route param only
- `decision`: `allow` or `deny`
- `source`: `engineer_mobile_task_detail_handler` or future accepted source name
- `organizationId`: sanitized context value only when safe
- `engineerId`: sanitized context value only when safe
- `requestId`: sanitized request id only when safe

Visit action candidate fields:

- `eventType`: `engineer_mobile.visit_action.allow` or `engineer_mobile.visit_action.deny`
- `route`: `/engineer-mobile/appointments/:appointmentId/actions/:action`
- `method`: `POST`
- `appointmentId`: validated route param only
- `action`: safe allowlisted action only, not arbitrary raw value
- `decision`: `allow` or `deny`
- `source`: `engineer_mobile_visit_action_handler` or future accepted source name
- `organizationId`: sanitized context value only when safe
- `engineerId`: sanitized context value only when safe
- `requestId`: sanitized request id only when safe

Route registration candidate fields:

- `eventType`: `engineer_mobile.route_registration.success` or `engineer_mobile.route_registration.failure`
- `route`: accepted Engineer Mobile production route summary path only
- `method`: accepted route method, currently `GET` or `POST`
- `module`: `engineerMobile`
- `registrationResult`: sanitized result value only

Identifier boundaries:

- `organizationId`, `engineerId`, `caseId`, and `appointmentId` may only come from sanitized auth/context/service input when safe.
- Do not include customer raw phone, raw address, raw email, raw LINE identity, or private customer identifiers.

## Metadata Candidates

Metadata must be allowlisted and primitive only. Candidate keys:

- `routeMatched`
- `contextPresent`
- `identifierValid`
- `permissionPassed`
- `actionAllowed`
- `dependencyValid`
- `registrationResult`

Metadata must not include:

- raw policy rules
- entitlement details
- provider payloads
- DB rows
- query metadata
- SQL
- debug traces
- stack traces
- raw request or response objects

## Non-Leakage Boundaries

Engineer Mobile audit events must never include:

- raw request
- raw response
- headers
- rawHeaders
- authorization
- cookies
- tokens
- body object
- query object
- params object
- raw user object
- raw session object
- raw auth object
- raw channel object
- raw access object
- customer phone
- customer address
- customer email
- raw LINE identity
- raw customer context
- raw engineer context
- raw service result
- DB rows
- query metadata
- provider payload
- raw payload
- LINE/SMS/email/app push payload
- AI prompts
- AI responses
- debug output
- stack traces
- SQL
- internal fields
- private fields
- admin-only fields
- completion report private body
- engineer private notes
- customer private notes

## Future Task Split

These are candidate future tasks only. They are not authorization.

- Future Task A: Engineer Mobile audit event builder skeleton / no runtime integration
- Future Task B: Engineer Mobile audit writer result normalizer or Customer Access normalizer reuse decision packet
- Future Task C: Engineer Mobile injected audit writer adapter skeleton / no provider / no DB
- Future Task D: Engineer Mobile task list audit side-channel runtime integration
- Future Task E: Engineer Mobile task detail audit side-channel runtime integration
- Future Task F: Engineer Mobile visit action audit side-channel runtime integration
- Future Task G: Engineer Mobile route-registration audit side-channel integration
- Future Task H: Engineer Mobile audit side-channel branch checkpoint

Recommended first follow-up, if PM chooses to continue this branch:

- Future Task A: Engineer Mobile audit event builder skeleton / no runtime integration

Rationale:

- Builder-first work can define sanitized event contracts before touching runtime handlers.
- It can be tested without DB, provider sending, server startup, smoke, or production mount activation.
- It keeps task list, task detail, visit action, and route-registration integration separate.

## Explicit Non-Goals

Task2166 does not authorize:

- source/runtime changes
- test changes
- package changes
- audit builder implementation
- audit writer implementation
- runtime audit integration
- Engineer Mobile production mount activation
- Customer Access changes
- `src/app.js` changes
- `src/server.js` changes
- `public.routes.js` changes
- route index changes
- DB execution
- DB connection creation
- migration apply or dry-run
- SQL execution
- `psql`
- `DATABASE_URL`
- env, Zeabur, or secrets inspection
- provider sending
- LINE/SMS/email/webhook/app push
- smoke or endpoint probes
- server/listener startup
- AI/RAG/model calls
- admin frontend work
- billing/payment work
- DTO behavior changes

The 7 held historical docs remain out of scope and must remain untracked and untouched.

## Expected Verification

Docs-only verification:

```bash
git diff --check -- docs/task-2166-engineer-mobile-audit-side-channel-planning-no-runtime-change.md
git status --short --branch
```

Node tests are not expected because Task2166 is docs-only and no source/test files should change.
