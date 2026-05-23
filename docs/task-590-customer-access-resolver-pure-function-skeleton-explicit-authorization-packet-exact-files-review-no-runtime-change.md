# Task 590 - Customer Access Resolver Pure Function Skeleton Explicit Authorization Packet

## Scope

Task590 is a docs-only explicit authorization packet and exact-files review for a possible future Customer Access Resolver pure function skeleton.

Task590 is:

- docs-only.
- no runtime.
- no `src/` changes.
- no test code changes.
- no fixture changes.
- no API.
- no route / controller.
- no DTO / projection.
- no DB.
- no migration.
- no provider sending.
- no AI / RAG / vector DB.

Task590 does not authorize implementation.

## Current Baseline Recap

Current accepted baseline:

- Task574 through Task578: resolver static baseline closed.
- Task579: runtime authorization packet completed.
- Task580 through Task582: pure function skeleton proposal, readiness gate, and exact implementation packet completed.
- Task583 through Task584: unit test plan and exact implementation packet completed.
- Task585 through Task586: response envelope proposal and exact implementation packet completed.
- Task587: pure function skeleton authorization review completed.
- Task588: unit test authorization review completed.
- Task589: response envelope authorization review completed.

Current state:

- actual pure function skeleton still not authorized.
- actual unit test file still not authorized.
- actual response envelope helper still not authorized.
- API, route, controller, DTO, projection, DB, migration, provider sending, and AI remain no-go.

## Explicit Non-authorization Conclusion

TASK590 DOES NOT AUTHORIZE CREATION OF `src/customerAccess/customerAccessResolver.js`.

Task590 only creates a future authorization packet.

Task590 does not:

- create `resolveCustomerAccess`.
- create resolver module.
- create unit test.
- create response envelope helper.
- change runtime behavior.

## Future Exact File Authorization Candidate

If a future task separately authorizes the resolver skeleton, the only recommended file is:

```text
src/customerAccess/customerAccessResolver.js
```

Future implementation should allow only this single file unless PM separately authorizes additional files.

Task590 does not create this file.

## Future Allowed Implementation Boundary

If later authorized, this resolver skeleton must be:

- pure function only.
- deterministic input to decision output.
- side-effect free.
- fail-closed by default.
- no DB.
- no repository.
- no route / controller.
- no DTO / projection.
- no provider.
- no AI / RAG.
- no audit log write.
- no file storage access.
- no Field Service Report write.
- no appointment write.
- no publication state write.
- no customer identity write.
- no finalAppointmentId modification.

## Future Function Boundary

Future conceptual function name:

```text
resolveCustomerAccess(input) -> decision
```

Task590 does not create this function.

Future function output must not include:

- customer-visible raw denial reason.
- raw phone.
- raw address.
- raw LINE id.
- internal note.
- audit log.
- AI raw payload.
- internal billing data.

## Future Exact Forbidden Imports

Even if a future task authorizes the resolver skeleton, it must not import:

- DB client / transaction helper.
- repository.
- route / controller.
- provider / LINE / SMS / Email / App push.
- AI / RAG / vector DB client.
- billing / settlement service.
- file storage writer.
- audit log writer.
- permission runtime writer.
- customer identity writer.
- publication state writer.

## Future Acceptance Criteria

If future implementation is explicitly authorized, it must at least satisfy:

- only one new file: `src/customerAccess/customerAccessResolver.js`.
- exports pure resolver function only.
- no DB / repository / provider / controller / route imports.
- fail-closed on missing organization scope.
- fail-closed on unverified customer identity.
- fail-closed on missing Case linkage.
- fail-closed on publication not allowed.
- fail-closed on customer-visible policy failure.
- treats LINE id as scoped channel identity only.
- `organization_id + line_channel_id + line_user_id` alone is insufficient authorization.
- raw phone / address / LINE id alone is insufficient authorization.
- does not create, approve, or publish formal Field Service Report.
- does not modify completion source-data.
- does not modify finalAppointmentId.
- does not write runtime data.

## Future Allowed Commands Draft

If future implementation is separately authorized, suggested commands:

```bash
node --check src/customerAccess/customerAccessResolver.js
git diff --check -- src/customerAccess/customerAccessResolver.js
```

Task590 must not run the `node --check` command above because the file does not exist and Task590 does not create it.

Task590 may only run:

```bash
git diff --check -- docs/task-590-customer-access-resolver-pure-function-skeleton-explicit-authorization-packet-exact-files-review-no-runtime-change.md
```

## Stop Conditions

Future implementation must stop and report to PM if it appears to require:

- DB access.
- repository access.
- route / controller.
- customer-facing endpoint.
- DTO / projection implementation.
- response envelope implementation.
- unit test implementation unless separately authorized.
- audit log write.
- provider sending.
- AI / RAG.
- migration / schema.
- package change.
- permission runtime.
- entitlement runtime.
- customer identity runtime write.
- publication state write.
- real customer PII.
- token / secret.
- LINE credential.
- changes outside exact authorized files.

## Mandatory Invariants

Any future resolver skeleton work must preserve:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver cannot create, approve, or publish a formal Field Service Report.
- Resolver cannot modify completion source-data.
- Resolver cannot modify finalAppointmentId.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.

## Next Task Candidates

Candidates only; do not execute from Task590:

- Task591 - Customer Access Resolver Unit Test Explicit Authorization Packet / Exact Files Review / No Runtime Change.
- Task592 - Customer Access Response Envelope Explicit Authorization Packet / Exact Files Review / No Runtime Change.
- Task593 - Customer Access Resolver Pure Function Skeleton Final Go / No-Go Review / No Runtime Change.

Task590 does not start Task591.

## Non-goals

Task590 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task589 documents.

Task590 does not run:

- tests.
- smoke tests.
- DB commands.
- migration commands.
- API commands.
- browser commands.
- provider sending commands.
- `node --test tests/customerAccess/customerAccessResolver.unit.test.js`.
- `node --check src/customerAccess/customerAccessResolver.js`.
- `node --check src/customerAccess/customerAccessResponseEnvelope.js`.

## Guardrails Review

Task590 remains aligned with `PROJECT_GUARDRAILS.md`:

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
