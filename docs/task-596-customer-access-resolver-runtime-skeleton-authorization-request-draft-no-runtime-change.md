# Task 596 - Customer Access Resolver Runtime Skeleton Authorization Request Draft

## Scope

Task596 is a docs-only authorization request draft for a possible future Customer Access Resolver runtime skeleton.

Task596 is:

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

Task596 does not authorize runtime implementation.

## Current Baseline Recap

Current accepted baseline:

- Task574 through Task578: resolver static baseline closed.
- Task579: runtime authorization packet completed.
- Task580 through Task582: pure function skeleton proposal, readiness gate, and exact implementation packet completed.
- Task583 through Task584: unit test plan and exact implementation packet completed.
- Task585 through Task586: response envelope proposal and exact implementation packet completed.
- Task587 through Task589: authorization reviews completed.
- Task590 through Task592: explicit authorization packets completed.
- Task593: resolver skeleton final go / no-go review completed; result is runtime NO-GO.
- Task594: unit test final go / no-go review completed; result is test implementation NO-GO.
- Task595: response envelope final go / no-go review completed; result is response envelope implementation NO-GO.

Current state:

- actual runtime skeleton still not authorized.
- actual unit test file still not authorized.
- actual response envelope helper still not authorized.

## Explicit Non-authorization Conclusion

TASK596 IS ONLY AN AUTHORIZATION REQUEST DRAFT. IT DOES NOT AUTHORIZE RUNTIME IMPLEMENTATION.

Task596 does not:

- create `src/customerAccess/customerAccessResolver.js`.
- create `resolveCustomerAccess`.
- create unit test.
- create response envelope helper.
- change runtime behavior.

The draft wording in this document must not be treated as current user authorization.

## Future Authorization Request Draft

The following text is a future draft only. It is not current authorization.

```text
PM to user:

Do you explicitly authorize Codex to create exactly one new runtime skeleton file:

src/customerAccess/customerAccessResolver.js

Scope requested:
- pure function skeleton only.
- deterministic input -> decision output.
- side-effect free.
- fail-closed by default.
- no DB.
- no repository.
- no route / controller.
- no DTO / projection.
- no provider / LINE / SMS / Email / App push.
- no AI / RAG / vector DB.
- no audit log write.
- no file storage access.
- no Field Service Report / appointment / publication / customer identity write.
- no finalAppointmentId modification.
- no unit test file in this task unless separately authorized.
- no response envelope helper in this task unless separately authorized.

Allowed commands if approved:
- node --check src/customerAccess/customerAccessResolver.js
- git diff --check -- src/customerAccess/customerAccessResolver.js

Completion process:
- Codex reports the exact file changed, command results, no-go boundaries preserved, and PM reviews before any next step.

This request does not authorize DB, migration, route/controller/API, provider sending, AI/RAG, unit test, or response envelope implementation.
```

## Future Exact Implementation Boundary

If user explicitly authorizes the first runtime skeleton, it must be:

- single file only: `src/customerAccess/customerAccessResolver.js`.
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

## Future Acceptance Criteria Draft

If future implementation is explicitly authorized, it must satisfy:

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
- no customer-visible raw denial reason.
- no raw phone / address / LINE id in output.
- no internal note / audit log / AI raw payload / internal billing data in output.
- does not create, approve, or publish formal Field Service Report.
- does not modify completion source-data.
- does not modify finalAppointmentId.
- does not write runtime data.

## Future Stop Conditions

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
- changes outside exact authorized file.

## Mandatory Invariants

Any future resolver work must preserve:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver cannot create, approve, or publish a formal Field Service Report.
- Resolver cannot modify completion source-data.
- Resolver cannot modify finalAppointmentId.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.
- Resolver cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or cross-organization data.

## Next Task Candidates

Candidates only; do not execute from Task596:

- Task597 - Customer Access Resolver Runtime Skeleton Branch PM Handoff / No Runtime Change.
- Task598 - Customer Access Resolver Runtime Skeleton Final Scope Lock / No Runtime Change.
- Task599 - Customer Access Resolver Runtime Skeleton Explicit User Authorization Review / No Runtime Change.

Task596 does not start Task597.

## Non-goals

Task596 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task595 documents.

Task596 does not run:

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

Task596 remains aligned with `PROJECT_GUARDRAILS.md`:

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
