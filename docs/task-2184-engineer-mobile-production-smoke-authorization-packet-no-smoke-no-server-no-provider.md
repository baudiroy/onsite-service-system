# Task2184 - Engineer Mobile Production Smoke Authorization Packet

## Status

- Created a docs-only production smoke authorization packet for future Engineer Mobile live/smoke verification.
- Task2184 is an authorization packet only.
- This task does not run smoke.
- This task does not start a server/listener.
- This task does not hit endpoints.
- This task does not inspect env, Zeabur, or secrets.
- This task does not execute DB or create DB connections.
- This task does not authorize production/staging traffic.
- This task does not authorize provider sending.
- This task does not authorize migration apply/dry-run.
- This task does not authorize real customer/engineer data usage.
- The 7 held historical docs remain untracked and untouched.

## Current Accepted Readiness

Engineer Mobile public routes are wired through `src/routes/index.js`:

- `GET /engineer-mobile/tasks`
- `GET /engineer-mobile/tasks/:appointmentId`
- `POST /engineer-mobile/appointments/:appointmentId/actions/:action`

Current route composition status:

- `src/app.js` remains unchanged.
- `src/server.js` remains the listener/server boundary.
- `src/routes/public.routes.js` remains unchanged.
- Internal/test Engineer Mobile routes are not public.
- Unit/static/synthetic HTTP behavior verification exists.
- No real smoke, server/listener startup, DB execution, provider sending, staging traffic, or production traffic has been executed.

## Future Explicit Smoke Authorization Required

A future PM/user must explicitly authorize smoke with wording equivalent to:

> Authorize Task2185 Engineer Mobile smoke against [environment name] for GET /engineer-mobile/tasks, GET /engineer-mobile/tasks/:appointmentId, and POST /engineer-mobile/appointments/:appointmentId/actions/:action, using safe synthetic identifiers only, no secrets printed, no provider sending.

Generic phrases are not sufficient authorization unless environment, endpoints, identifiers, provider constraints, and secret-handling constraints are named.

Insufficient generic phrases include:

- "test it"
- "try it"
- "run smoke"
- "check production"
- "go ahead"

## Future Smoke Target Requirements

Future smoke authorization must name:

- environment
- base URL source
- endpoints included
- safe identifiers to use
- whether the POST visit action route is included or excluded
- secret-handling constraints
- provider-sending constraints
- report redaction constraints

Future smoke target requirements:

- Environment must be explicitly named.
- Base URL must be provided by the user or by an existing safe config source in a future authorized task.
- No env/Zeabur inspection unless separately authorized.
- No secrets may be printed.
- No provider sending.
- No DB mutation or DB command unless separately authorized.
- Use only safe synthetic/non-sensitive engineer and appointment identifiers unless the user explicitly authorizes real test data.
- Do not use real customer phone/address/email/LINE identity in report.
- Do not include real engineer private notes or customer private notes in report.

## Future Allowed Smoke Endpoints

Only these endpoints may be considered:

- `GET /engineer-mobile/tasks`
- `GET /engineer-mobile/tasks/:appointmentId`
- `POST /engineer-mobile/appointments/:appointmentId/actions/:action`

POST visit action endpoint risk:

- It may trigger workflow/service behavior.
- It must not trigger provider sending.
- It must use safe synthetic/test appointment only.
- It should be excluded unless PM explicitly includes it in smoke authorization.

Do not test:

- internal/test routes
- admin routes
- provider routes
- unrelated mutation routes
- DB health endpoints unless separately authorized
- unsupported methods unless future authorization explicitly includes negative method/path tests
- near-match paths unless future authorization explicitly includes negative method/path tests

## Expected Safe Outcomes

- A valid synthetic task list request may return an accepted allow response.
- A valid synthetic task detail request may return an accepted allow response.
- A synthetic/nonexistent appointment may return safe unavailable/deny response according to current route behavior.
- Visit action smoke must not require or reveal real workflow state.
- Smoke must not require revealing whether a real appointment/customer exists.
- Smoke must not print raw response if it contains unexpected sensitive data.
- Any unexpected sensitive response must be summarized safely and treated as a stop condition.

## Future Stop Conditions

Future smoke must stop and report if:

- explicit environment/base URL is missing
- env/Zeabur/secrets inspection is needed without authorization
- a request would include real customer/engineer PII without explicit authorization
- an endpoint would trigger provider sending
- a command would start a server/listener unexpectedly
- any DB command would run
- any migration command would run
- a response contains raw tokens, phone/address/email/LINE identity, SQL, stack, debug, private fields, internal notes, provider payloads, or DB rows
- any route outside the three accepted Engineer Mobile routes is required
- POST visit action would mutate real data
- POST visit action would trigger provider sending
- production/staging credentials would need to be printed

## Future Smoke Completion Report Requirements

Future smoke report must include:

- environment name
- base URL, sanitized
- endpoints tested
- identifiers used, sanitized
- whether POST visit action was included or excluded
- response status summary
- safe response shape summary
- confirmation no secrets were printed
- confirmation no provider sending occurred
- confirmation no DB commands ran
- confirmation no migration commands ran
- confirmation no internal routes were tested
- confirmation no real PII appears in the report
- failures summarized without raw sensitive output

## Explicit Non-Goals For Task2184

- No smoke execution now.
- No endpoint probe now.
- No server/listener now.
- No env/Zeabur inspection.
- No DB execution.
- No DB connection creation.
- No migration apply/dry-run.
- No SQL execution.
- No provider sending.
- No source/test/package changes except this doc.
- No route changes.
- No `src/app.js` changes.
- No `src/server.js` changes.
- No `src/routes/public.routes.js` changes.
- No production/staging traffic.
- No real customer/engineer data usage.
- No Customer Access changes.
- No admin frontend work.
- No AI, RAG, provider, or model calls.
- No billing/payment work.
- No internal route exposure.

## Verification

Docs-only verification:

```sh
git diff --check -- docs/task-2184-engineer-mobile-production-smoke-authorization-packet-no-smoke-no-server-no-provider.md
git status --short --branch
```

Expected verification scope:

- No node tests are required because no source or test files changed.
- No DB commands.
- No DB connection commands.
- No migration commands.
- No smoke or endpoint probes.
- No server or listener startup.
- No env, Zeabur, or secret inspection.
- No provider sending.
- No provider messages.

Results:

- `git diff --check -- docs/task-2184-engineer-mobile-production-smoke-authorization-packet-no-smoke-no-server-no-provider.md`: PASS.
- `git status --short --branch`: `main...origin/main` with this Task2184 doc plus the same 7 held historical docs untracked before commit.
- Node tests were not run because this task is docs-only and no source/test files changed.
