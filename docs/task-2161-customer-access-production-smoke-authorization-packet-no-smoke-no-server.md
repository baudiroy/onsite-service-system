# Task2161 - Customer Access Production Smoke Authorization Packet / No Smoke No Server

## Scope

Task2161 is an authorization packet only. It prepares the rules for a possible future Customer Access live/smoke verification task. It does not authorize or perform smoke execution, server/listener startup, endpoint probes, env/Zeabur/secret inspection, DB execution, migration dry-run/apply, provider sending, or production/staging traffic.

## Current Accepted Readiness

From Task2160:

- Customer Access public routes are wired through `src/routes/index.js`.
- Accepted public routes:
  - `GET /customer-access/:caseId`
  - `GET /customer-access/:caseId/service-report/:reportId`
- `src/app.js` delegates `customerAccess` options.
- `src/server.js` remains the listener/server boundary.
- Internal test route is not public:
  - `/__internal/customer-access/service-reports/:caseId/:reportId`
- Unit/static/synthetic HTTP behavior verification exists.
- No real smoke, server/listener startup, DB execution, or production/staging traffic has been executed.

## Explicit Future Authorization Required

Future PM/user must explicitly authorize a smoke execution task with environment, endpoints, and secret-handling constraints named. A sufficient phrase should be similar to:

> Authorize Task2162 Customer Access smoke against [environment name] for GET /customer-access/:caseId and GET /customer-access/:caseId/service-report/:reportId, no secrets printed, no provider sending.

Generic phrases are not sufficient by themselves:

- "test it"
- "try it"
- "run smoke"
- "check production"
- "go ahead"

The future authorization must name:

- target environment
- base URL source or provided base URL
- exact endpoints
- secret-handling constraints
- provider-sending prohibition
- data-sensitivity constraints

## Future Smoke Target Requirements

Any future smoke task must satisfy all of these requirements before execution:

- environment is explicitly named
- base URL is provided by the user or by an explicitly authorized safe config source
- no env/Zeabur inspection unless separately authorized
- no secrets are printed
- no provider sending
- no DB mutation
- no DB command unless separately authorized
- only safe synthetic/non-sensitive case/report identifiers are used unless real test data is explicitly authorized
- no real customer phone/address/email/LINE identity is included in the report

## Future Allowed Smoke Endpoints

Only these endpoints may be considered in a future smoke task:

- `GET /customer-access/:caseId`
- `GET /customer-access/:caseId/service-report/:reportId`

Do not test these without separate explicit authorization:

- `/__internal/customer-access/service-reports/:caseId/:reportId`
- admin routes
- provider routes
- mutation routes
- DB health endpoints
- unsupported methods
- negative method/path tests

## Expected Safe Outcomes

A valid authorized test case may return the accepted allow response.

A synthetic or nonexistent case/report may return safe-deny:

- HTTP `404`
- `status: deny`
- `messageKey: customerAccess.unavailable`
- `customerVisible: false`
- `data: null`
- `error.messageKey: customerAccess.unavailable`

Smoke must not require revealing whether a case/report exists. If a response contains unexpected sensitive data, do not print the raw response; summarize safely and stop.

## Future Stop Conditions

Stop before execution if any of these are true:

- explicit environment or base URL is missing
- Zeabur/env/secrets must be inspected without authorization
- request would include real customer PII without explicit authorization
- endpoint would trigger provider sending
- command would start a server/listener unexpectedly
- DB command would run
- response contains raw tokens, phone/address/email/LINE identity, SQL, stack, debug, or private fields
- route outside the two accepted public routes is required
- smoke requires mutation or `POST`/`PUT`/`PATCH`/`DELETE`

## Future Smoke Completion Report Requirements

A future smoke execution report must include:

- environment name
- sanitized base URL
- endpoints tested
- sanitized identifiers used
- response status summary
- safe response shape summary
- confirmation no secrets were printed
- confirmation no provider sending occurred
- confirmation no DB commands ran
- confirmation no mutation occurred
- confirmation no internal routes were used
- any failure summarized without raw sensitive output

## Explicit Non-Goals For Task2161

- no smoke execution now
- no endpoint probes now
- no server/listener startup now
- no env/Zeabur inspection
- no DB execution
- no DB connection creation
- no migration apply/dry-run
- no provider sending
- no source/test/package changes except this doc
- no route changes
- no production/staging traffic

PM must still authorize one exact future smoke task before any live verification occurs.
