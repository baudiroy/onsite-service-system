# Task 917 - Customer Access Production Route Authorization Packet

## Status

Completed.

## Goal

Prepare an explicit authorization packet for a future production route mounting of the Customer Access service report projection flow.

Task917 does not authorize route implementation. Task917 does not authorize public API rollout. Task917 does not authorize DB/migration/psql/db:migrate/DDL/SQL. Task917 does not authorize auth/session/JWT runtime.

Future route implementation requires a separate explicit PM task. This packet only defines the exact boundaries that must be satisfied before any later task may touch production route/app/bootstrap files.

## Modified Files

- `docs/task-917-customer-access-production-route-authorization-packet-no-route-implementation.md`
- `tests/customerAccess/customerAccessProductionRouteAuthorizationPacket.static.test.js`

No production source change was made.

No src/** modification. No admin/src. No migrations. No route registration. No app/server/bootstrap/listen. No auth/session/JWT runtime. No real DB/repository/transaction. No provider. No AI/RAG runtime. No billing/settlement. No package/env/config/credential. No smoke/shared runtime.

No `src/**` modification, no `admin/src`, no migrations, no route registration, no app/server/bootstrap/listen, no auth/session/JWT runtime, no real DB/repository/transaction, no provider files, no AI/RAG runtime, no billing/settlement, no package/env/config/credential, no smoke/shared runtime.

## Current Customer Access Branch Surface

Customer Access is currently closed / paused at the synthetic app adapter boundary:

```text
synthetic context resolver -> projection service -> HTTP-like handler -> synthetic app/router adapter
```

Accepted components:

- Task908 projection service.
- Task909 handler.
- Task911 context resolver.
- Task914 adapter pattern.
- Task910 / Task912 / Task915 closure guards.
- Task916 master patch inclusion checkpoint.

This is not a production route. It is not public customer API exposure.

## Future Route Preconditions

Any future route implementation task must explicitly say which route mode is being authorized:

- internal test-only route;
- authenticated customer portal route;
- brand/customer channel route;
- public unauthenticated route, which remains forbidden unless separately justified.

Any future route implementation must specify:

- exact production route/app/bootstrap files allowed to change;
- whether the route is mounted under an existing router or a new router;
- the request identity source and why it is safe;
- whether Task911 synthetic/pre-resolved context is still used or a later approved real auth resolver replaces it;
- the customer-visible response shape;
- safe-deny behavior and status code policy;
- rate limit / enumeration protection expectations;
- logging and audit expectations that do not leak sensitive data;
- verification commands and rollback/handoff notes.

## Required Future Implementation Boundaries

Future route implementation must use or preserve:

- Task908 projection service;
- Task909 handler;
- Task911 context resolver or a later approved real auth resolver;
- Task914 adapter pattern or equivalent safe route mount;
- generic safe-deny;
- organization isolation;
- customer-visible allowlist;
- no existence leakage;
- no raw phone/address/LINE id;
- no finalAppointmentId;
- no internal notes;
- no raw DB rows;
- no SQL/stack/token/secret leakage.

Future route implementation must not:

- must not create/approve/publish Field Service Report;
- must not mutate Case, Appointment, customer identity, provider state, or finalAppointmentId;
- expose raw customer profile;
- expose internal report fields;
- expose provider payloads;
- expose AI payloads;
- expose billing/settlement internals;
- bypass organization scope;
- bypass customer-visible field policy;
- bypass safe-deny behavior.

## Explicit Non-Authorization

This packet does not authorize:

- production route implementation;
- public route;
- route registration;
- app/server/bootstrap/listen edits;
- public API rollout;
- API shape change;
- real DB connection;
- repository-backed access;
- customer identity repository;
- auth/session/JWT runtime;
- login/session implementation;
- bearer token verification;
- LINE identity verification;
- provider sending;
- AI/RAG runtime;
- billing/settlement runtime;
- migration;
- psql;
- `npm run db:migrate`;
- DDL/SQL apply or dry-run;
- smoke/shared runtime changes;
- package/env/config/credential changes;
- staging or commit.

## Acceptance Criteria

Task917 is accepted only if:

- No production source files are modified.
- No route/app/bootstrap/listen file is modified.
- No runtime behavior changes.
- No API shape changes.
- No auth/DB/provider/AI/billing/migration/smoke work occurs.
- The packet clearly defines what future route implementation must and must not do.
- The optional static guard proves the packet contains the no-runtime/no-route/no-DB/no-auth authorization boundaries.

## Verification

Commands to run:

```sh
git status --short
node --test tests/customerAccess/customerAccessProductionRouteAuthorizationPacket.static.test.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
git diff --check -- docs/task-917-customer-access-production-route-authorization-packet-no-route-implementation.md tests/customerAccess/customerAccessProductionRouteAuthorizationPacket.static.test.js
```

Current results:

- `git status --short`: PASS / observed broad pre-existing dirty and untracked worktree; Task917 files are untracked local additions:
  - `?? docs/task-917-customer-access-production-route-authorization-packet-no-route-implementation.md`
  - `?? tests/customerAccess/customerAccessProductionRouteAuthorizationPacket.static.test.js`
- `node --test tests/customerAccess/customerAccessProductionRouteAuthorizationPacket.static.test.js`: PASS, 5/5.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS, 2952/2952.
- `git diff --check -- docs/task-917-customer-access-production-route-authorization-packet-no-route-implementation.md tests/customerAccess/customerAccessProductionRouteAuthorizationPacket.static.test.js`: PASS.
