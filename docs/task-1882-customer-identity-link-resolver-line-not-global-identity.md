# Task1882 Customer Identity Link Resolver / LINE Not Global Identity

Status: completed locally, pending PM acceptance.

## Scope

- Added a pure customer identity link resolver for customer-facing access boundaries.
- Wired the resolver into `customerAccessContextProvider` for caller-provided and repository-provided identity link inputs.
- Kept DB, migration, provider, billing, AI/RAG, Zeabur, deployment, runtime start, and smoke paths untouched.

## Behavior

- A linked identity can resolve customer access only when the link is active/verified and scoped to the expected organization and customer context.
- LINE is treated as a scoped channel identifier only. A LINE user id alone is not a global customer identity.
- LINE links must include organization, customer, line channel, and line user scope. Optional case/contact scope must match when present.
- Missing, ambiguous, revoked, disabled, inactive, mismatched, or unsupported identity links fail closed.
- Resolver output omits raw LINE user id, raw phone/address, provider payloads, tokens, and secrets.

## Safety Boundaries

- No provider sending or provider import execution.
- No LINE, SMS, email, app push, webhook, AI/RAG, or billing provider execution.
- No Completion Report / Field Service Report creation, approval, publication, revocation, or mutation.
- No `finalAppointmentId` mutation.
- No DB connection, SQL execution, migration, seed, deploy, runtime start, or smoke.
- No bypass of customer access context or organization isolation.

## Verification

- Added synthetic resolver unit coverage for allowed linked identity, missing link, ambiguous link, revoked/disabled/inactive link, organization/customer/case/contact mismatches, LINE-not-global identity, unsupported providers, and leak prevention.
- Added customer access context provider coverage for direct and repository-provided linked identity resolution.
- Added static boundary coverage confirming no DB/provider/AI/billing/runtime side-effect imports or sending paths.
- `npm run check` is attempted when available; this shell currently has no `npm`, so the package `check` equivalent is `find src -name '*.js' -print0 | xargs -0 -n1 node --check` using the bundled Node binary.
