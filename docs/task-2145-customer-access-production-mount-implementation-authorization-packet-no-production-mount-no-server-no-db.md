# Task2145 - Customer Access Production Mount Implementation Authorization Packet

## Status

- Created a docs-only authorization packet for a future Customer Access production mount implementation task.
- Task2145 is an authorization packet only.
- This task does not authorize production mount.
- This task does not change runtime behavior.
- This task does not change source, tests, package files, migrations, app/server/public routes, or route mounts.
- This task does not start a server/listener, run smoke/endpoint probes, execute DB commands, inspect env/Zeabur/secrets, or authorize production traffic.
- The 7 held historical docs remain untracked and untouched.

## Baseline

- Branch: `main`.
- Starting HEAD/origin baseline: `7c49780f6f1af87242e660cedc5736530a65beee`.
- Local `main` equaled `origin/main`.
- `git status --short --branch` showed only the same 7 held historical docs untracked before work.
- Task2144 was accepted, pushed, and synced.
- Customer Access production mount composition adapter branch is checkpointed.

## Current Accepted Readiness

- Task2099/Task2100 production mount readiness gate exists.
- Task2142 production mount composition adapter exists.
- Task2143 regression guards exist.
- Task2144 branch checkpoint exists.

Accepted production mount composition API:

```js
createCustomerAccessProductionMountComposition({
  router,
  dbClient,
  repository,
  auditWriter,
})
```

Accepted public Customer Access routes:

- `GET /customer-access/:caseId`
- `GET /customer-access/:caseId/service-report/:reportId`

No additional public Customer Access routes are authorized.

Internal test route remains separate and must not be production-mounted:

- `/__internal/customer-access/service-reports/:caseId/:reportId`

## Future Explicit Authorization Required

A future PM must explicitly authorize a production mount task with wording equivalent to:

> Authorize Task2146 Customer Access production mount implementation using existing production mount composition adapter only; no server start, no smoke, no DB.

Generic phrases are not sufficient authorization, including:

- "mount it"
- "go ahead"
- "connect it"
- "deploy it"
- "make it live"

## Future Task2146 Candidate Scope

Future Task2146 may inspect app/server/public route structure before editing.

Potential future target files must be explicitly identified by PM and may include:

- `src/app.js`
- `src/server.js`
- `public.routes.js`
- the actual app composition route registry file if inspection shows a different pattern

Future Task2146 must use:

- `createCustomerAccessProductionMountComposition`
- the existing injected registration contract

Future Task2146 must not bypass:

- `registerCustomerAccessRoutes`
- Customer Access context middleware
- service-report projection handler
- case overview controller boundary

Future Task2146 must not add new route paths.

## Future Dependency Requirements

- Mount target must be an explicit production app/router object.
- `dbClient` must be explicitly provided by the existing app composition dependency pattern.
- `repository` is optional, only if existing Customer Access route registration needs it.
- `auditWriter` is optional; if provided, it must remain `function writer(auditEvent)`.
- No global DB pool fallback inside Customer Access modules.
- No env lookup inside Customer Access mount adapter.
- No provider, AI/RAG/model, or billing dependency.

## Future Required Verification

Future Task2146 should use static/unit tests only unless later explicitly authorized.

Expected verification candidates:

- production mount composition adapter tests
- `customerAccessRoutes` tests
- mounted route allow/safe-deny tests
- production mount static boundary guard

Future Task2146 must not run:

- server/listener startup
- smoke or endpoint probes
- DB commands
- migration commands
- env/Zeabur inspection
- secret printing

## Future Stop Conditions

Future Task2146 must stop and report if:

- app/server/public route composition pattern is unclear
- mounting requires server/listener startup
- mounting requires DB connection creation or DB query during import/registration
- mounting would add routes beyond the two accepted public routes
- internal test route would be exposed publicly
- env/Zeabur/secrets must be inspected
- provider sending or external network is needed
- existing route registration summary changes

## Future Rollback And Safety Expectations

- Any production mount implementation must be one bounded commit.
- No force push.
- No clean/reset/stash of held docs.
- No DB migration/apply in the same task.
- If tests fail due to app composition mismatch, stop and report instead of broad refactor.
- Customer-facing safe-deny behavior must remain unchanged.
- Audit failure must remain side-channel only.

## Explicit Non-Goals For Task2145

- No production mount now.
- No source/runtime/test/package changes except this doc.
- No app/server/public routes edit.
- No server/listener startup.
- No smoke/endpoint probes.
- No DB execution.
- No migration apply/dry-run.
- No env/Zeabur inspection.
- No provider/admin/AI/billing/package work.
- No new routes.
- No internal route public exposure.

## Verification

Docs-only verification:

```sh
git diff --check -- docs/task-2145-customer-access-production-mount-implementation-authorization-packet-no-production-mount-no-server-no-db.md
git status --short --branch
```

Expected verification scope:

- No node tests are required because no source or test files changed.
- No DB commands.
- No migration commands.
- No smoke or endpoint probes.
- No server or listener startup.
- No env, Zeabur, or secret inspection.

Results:

- `git diff --check -- docs/task-2145-customer-access-production-mount-implementation-authorization-packet-no-production-mount-no-server-no-db.md`: PASS.
- `git status --short --branch`: `main...origin/main` with this Task2145 doc plus the same 7 held historical docs untracked before commit.
- Node tests were not run because this task is docs-only and no source/test files changed.
