# Task 592 - Customer Access Response Envelope Explicit Authorization Packet

## Scope

Task592 is a docs-only explicit authorization packet and exact-files review for a possible future Customer Access Response Envelope helper.

Task592 is:

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

Task592 does not authorize response envelope implementation.

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
- Task590: resolver pure function skeleton explicit authorization packet completed.
- Task591: unit test explicit authorization packet completed.

Current state:

- actual response envelope helper still not authorized.
- actual resolver skeleton still not authorized.
- actual unit test file still not authorized.

## Explicit Non-authorization Conclusion

TASK592 DOES NOT AUTHORIZE CREATION OF `src/customerAccess/customerAccessResponseEnvelope.js`.

Task592 only creates a future response envelope authorization packet.

Task592 does not:

- create response envelope helper.
- create `buildCustomerAccessAllowEnvelope`.
- create `buildCustomerAccessDenyEnvelope`.
- create `buildCustomerAccessEnvelope`.
- create DTO / projection / schema / localization key.
- modify route / controller / API.
- create resolver runtime.
- change runtime behavior.

## Future Exact Helper File Authorization Candidate

If a future task separately authorizes the response envelope helper, the only recommended helper file is:

```text
src/customerAccess/customerAccessResponseEnvelope.js
```

Future implementation should allow only this single helper file unless PM separately authorizes additional files.

Future implementation must not:

- modify controller.
- modify route.
- create DTO runtime.
- create projection service runtime.
- add localization key unless separately authorized.
- add test file unless separately authorized.

Task592 does not create this file.

## Future Helper Dependency Boundary

Response envelope helper may only wrap future already-authorized resolver decision / projection output.

It must not:

- decide access permission itself.
- decide publication allowed itself.
- read Case / Customer / Field Service Report / appointment itself.
- read DB / repository itself.
- output resolver internal reason to customer-visible field.
- turn deny reason into customer-visible leakage.

## Future Allowed Helper Boundary

If later authorized, response envelope helper must be:

- pure helper only.
- deterministic input to envelope output.
- side-effect free.
- no server startup.
- no DB connection.
- no repository import.
- no route / controller import.
- no provider import.
- no AI / RAG import.
- no audit log write.
- no file storage access.
- no runtime write.
- no customer identity write.
- no publication state write.
- no finalAppointmentId modification.

## Future Allow Envelope Criteria

Future allow envelope must:

- contain customer-visible filtered publication view only.
- may contain generic success status.
- may contain public-safe request reference.
- may contain customer-visible case / service metadata.
- may contain customer-visible appointment / completion summary.
- may contain file / photo references only if future file policy authorizes.
- must not include internal note.
- must not include audit log.
- must not include AI raw payload / AI confidence score.
- must not include resolver internal reason.
- must not include permission evaluation details.
- must not include identity match details.
- must not include tenant mismatch details.
- must not include internal billing / settlement / vendor reconciliation data.
- must not include engineer internal comment or supervisor review.
- must not include cross-organization data.
- must not include raw LINE id.
- must not include token / secret.
- must not include full unmasked phone / address unless future customer-visible policy explicitly authorizes.
- must not include unpublished / draft Field Service Report content.
- must not include completion source-data not yet published for customer view.

## Future Deny Envelope Criteria

Future deny envelope must:

- use generic unavailable / safe-deny.
- not leak Case existence.
- not leak customer existence.
- not leak organization mismatch.
- not leak identity mismatch.
- not leak publication state.
- not leak permission details.
- not expose resolver internal reason in customer-visible output.
- not expose customer PII.
- optionally include low-risk customer support guidance such as "please confirm the link or contact support".

## Future Allowed Commands Draft

If future helper implementation is separately authorized, suggested commands:

```bash
node --check src/customerAccess/customerAccessResponseEnvelope.js
git diff --check -- src/customerAccess/customerAccessResponseEnvelope.js
```

Task592 must not run the `node --check` command above because the file does not exist and Task592 does not create it.

Task592 may only run:

```bash
git diff --check -- docs/task-592-customer-access-response-envelope-explicit-authorization-packet-exact-files-review-no-runtime-change.md
```

## Stop Conditions

Future response envelope implementation must stop and report to PM if it appears to require:

- DB access.
- repository access.
- route / controller.
- customer-facing endpoint.
- DTO / projection implementation.
- resolver runtime implementation.
- unit test implementation unless separately authorized.
- audit log write.
- provider sending.
- AI / RAG.
- file storage access.
- migration / schema.
- package change.
- permission runtime.
- entitlement runtime.
- customer identity runtime write.
- publication state write.
- billing / settlement rules.
- real customer PII.
- token / secret.
- LINE credential.
- changes outside exact authorized helper file.

## Mandatory Invariants

Any future response envelope work must preserve:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver / envelope cannot create, approve, or publish a formal Field Service Report.
- Resolver / envelope cannot modify completion source-data.
- Resolver / envelope cannot modify finalAppointmentId.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.
- Customer-facing envelope cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or cross-organization data.

## Next Task Candidates

Candidates only; do not execute from Task592:

- Task593 - Customer Access Resolver Pure Function Skeleton Final Go / No-Go Review / No Runtime Change.
- Task594 - Customer Access Resolver Unit Test Final Go / No-Go Review / No Runtime Change.
- Task595 - Customer Access Response Envelope Final Go / No-Go Review / No Runtime Change.

Task592 does not start Task593.

## Non-goals

Task592 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task591 documents.

Task592 does not run:

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

Task592 remains aligned with `PROJECT_GUARDRAILS.md`:

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
