# Task 582 - Customer Access Resolver Pure Function Skeleton Exact Implementation Packet

## Scope

Task582 is a docs-only exact implementation packet for a possible future Customer Access Resolver pure function skeleton.

Task582 is:

- docs-only.
- no runtime.
- no `src/` changes.
- no test changes.
- no API.
- no DB.
- no migration.
- no provider sending.
- no AI / RAG / vector DB.

Task582 does not create the skeleton. It only records the future exact-file candidate, allowed code shape, forbidden imports, acceptance criteria, allowed-command draft, and stop conditions.

## Current Baseline Recap

The current customer access resolver branch has completed:

- Task574: implementation sequencing completed.
- Task575: resolver contract proposal completed.
- Task576: fixture marker extension completed.
- Task577: static decision matrix test completed, PASS 10/0.
- Task578: static baseline closure completed.
- Task579: runtime authorization packet completed.
- Task580: minimal runtime skeleton proposal completed.
- Task581: pure function skeleton readiness gate completed.

Current state:

- pure function skeleton still not authorized.
- resolver runtime remains no-go.
- API, DB, migration, provider sending, and AI remain no-go.

## Future Exact Implementation Candidate

If a future task explicitly authorizes the pure function skeleton, the only recommended exact-file candidate is:

```text
src/customerAccess/customerAccessResolver.js
```

Task582 does not create this file.

This path is a future exact-file candidate only. If later authorized, it should only contain a pure resolver function. It must not add:

- route.
- controller.
- repository.
- DB access.
- provider sending.
- DTO / projection implementation.
- customer-facing endpoint.

## Future Allowed Code Shape

Future conceptual shape:

```text
resolveCustomerAccess(input) -> decision
```

Task582 must not produce code.

If later authorized, the function should be:

- deterministic.
- side-effect free.
- fail-closed by default.
- input-only decision.
- no DB access.
- no repository import.
- no provider import.
- no request context mutation.
- no audit log write.
- no Field Service Report write.
- no appointment write.
- no publication state write.
- no customer identity write.
- no finalAppointmentId modification.

The function should return only a decision. It should not construct or return the customer-facing service report projection.

## Future Forbidden Imports / Dependencies

Even if the skeleton is later authorized, it must not import:

- DB client / transaction helper.
- repository.
- route / controller.
- provider / LINE / SMS / Email / App push client.
- AI / RAG / vector DB client.
- billing / settlement service.
- file storage writer.
- audit log writer.

If future implementation appears to need any of these, Codex must stop and report to PM instead of expanding scope.

## Future Decision Output Boundary

Future decision shape should be described as:

- allow / deny.
- generic safe-deny message key.
- internal reason code may exist only for server-side handling.
- no customer-visible raw denial reason.
- no raw phone / address / LINE id in output.
- no internal note.
- no audit log.
- no AI raw payload.
- no internal billing data.
- no customer PII beyond what a future customer-visible policy allows.

Customer-facing denial must remain generic and must not reveal Case existence, report existence, organization existence, customer matching failure, linkage failure, or publication state.

## Future Minimum Acceptance Criteria

If a future task truly authorizes the skeleton, minimum acceptance criteria should include:

- only one new file: `src/customerAccess/customerAccessResolver.js`, unless separately authorized.
- exports pure resolver function only.
- no DB imports.
- no repository imports.
- no provider imports.
- no controller imports.
- no route imports.
- fail-closed on missing organization scope.
- fail-closed on unverified customer identity.
- fail-closed on missing Case linkage.
- fail-closed on publication not allowed.
- fail-closed on customer-visible policy failure.
- treats LINE id as scoped channel identity only.
- does not create / approve / publish formal Field Service Report.
- does not modify completion source-data.
- does not modify finalAppointmentId.
- does not write any runtime data.

## Future Allowed Commands Draft

If a future skeleton implementation is authorized, suggested commands:

```bash
node --check src/customerAccess/customerAccessResolver.js
git diff --check -- src/customerAccess/customerAccessResolver.js
```

Task582 must not run the `node --check` command above because the file does not exist and is not authorized to be created.

Task582 may only run:

```bash
git diff --check -- docs/task-582-customer-access-resolver-pure-function-skeleton-exact-implementation-packet-no-runtime-change.md
```

## Stop Conditions

Future implementation must stop and report to PM if it appears to need:

- DB access.
- repository access.
- route / controller.
- customer-facing endpoint.
- DTO / projection.
- audit log write.
- provider sending.
- AI / RAG.
- migration / schema.
- package change.
- permission runtime.
- entitlement runtime.
- customer identity runtime write.
- publication state write.

These needs must not be handled by expanding a pure function skeleton task.

## Mandatory Invariants

Any future resolver work must preserve:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver cannot create, approve, or publish a formal Field Service Report.
- Resolver cannot modify completion source-data.
- Resolver cannot modify finalAppointmentId.
- LINE is not global identity.
- `organization_id + line_channel_id + line_user_id` alone is not sufficient authorization.
- Raw phone, address, or LINE id alone cannot authorize access.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.

## Next Task Candidates

Candidates only; do not execute from Task582:

- Task583 - Customer Access Resolver Pure Function Skeleton / Exact Files Only / No API / No DB.
- Task584 - Customer Access Resolver Unit Test Plan / No Runtime Change.
- Task585 - Customer Access Response Envelope Proposal / No Runtime Change.

Task582 does not start Task583.

## Non-goals

Task582 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task581 documents.

Task582 does not run:

- tests.
- smoke tests.
- DB commands.
- migration commands.
- API commands.
- browser commands.
- provider sending commands.
- `node --check src/customerAccess/customerAccessResolver.js`.

## Guardrails Review

Task582 remains aligned with `PROJECT_GUARDRAILS.md`:

- documentation-only.
- no runtime behavior change.
- no schema or migration change.
- no provider sending.
- no AI auto decision.
- no customer-facing endpoint implementation.
- no sensitive data output.
- no customer channel identity runtime change.
- no organization isolation runtime change.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
