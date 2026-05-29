# Task1881 Customer-facing Report Publication State Guard

Status: completed locally, pending PM acceptance.

## Scope

- Added a bounded customer-facing publication state guard inside the service report projection boundary.
- Kept the route, DB schema, migration, provider, billing, AI, Zeabur, and deployment surfaces unchanged.
- Used only synthetic unit coverage with injected `dbClient`.

## Behavior

- Customer-facing service report projection now requires an explicit publication allow/published signal in the customer access context.
- Draft, internal-only, revoked, unpublished, missing, or explicitly denied publication state fails closed with the existing generic safe-deny envelope.
- Rows that include publication state fields are also checked before projection output is built.
- Publication case/report reference mismatches fail closed.
- Rows without row-level publication state continue to rely on the already-verified customer access context guard.

## Safety Boundaries

- No Completion Report / Field Service Report creation, approval, publication, revocation, or mutation.
- No `finalAppointmentId` mutation.
- No raw Case, Appointment, Field Service Report, DB row, phone, address, provider payload, billing internals, audit internals, or organization-internal data exposure.
- No DB connection, SQL execution, migration, seed, deploy, runtime start, customer-visible smoke, provider sending, AI/RAG call, or billing execution.

## Verification

- Targeted customer service report projection tests.
- Targeted customer-facing handler and route boundary tests.
- Bundled Node syntax/static check over `src` and `tests/customerAccess`.
- `npm run check` is attempted when available; this shell currently has no `npm`, so the package `check` equivalent is `find src -name '*.js' -print0 | xargs -0 -n1 node --check` using the bundled Node binary.
