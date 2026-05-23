# Task 586 - Customer Access Response Envelope Exact Implementation Packet

## Scope

Task586 is a docs-only exact implementation packet for a possible future customer access response envelope helper.

Task586 is:

- docs-only.
- no runtime.
- no `src/` changes.
- no test code changes.
- no fixture changes.
- no API.
- no route / controller.
- no DTO / projection implementation.
- no DB.
- no migration.
- no provider sending.
- no AI / RAG / vector DB.

Task586 does not implement response envelope runtime.

## Current Baseline Recap

The current customer access branch has completed:

- Task574: implementation sequencing completed.
- Task575: resolver contract proposal completed.
- Task576: fixture marker extension completed.
- Task577: static decision matrix test completed, PASS 10/0.
- Task578: static baseline closure completed.
- Task579: runtime authorization packet completed.
- Task580: minimal runtime skeleton proposal completed.
- Task581: pure function skeleton readiness gate completed.
- Task582: pure function skeleton exact implementation packet completed.
- Task583: unit test plan completed.
- Task584: unit test exact implementation packet completed.
- Task585: response envelope proposal completed.

Current state:

- response envelope implementation is not authorized.
- resolver runtime remains no-go.
- API, route, controller, DTO, projection, DB, migration, provider sending, and AI remain no-go.

## Future Exact Implementation File Candidates

Future candidate names:

- `src/customerAccess/customerAccessResponseEnvelope.js`
- `src/customerAccess/customerAccessEnvelope.js`

Most conservative unique recommended candidate:

```text
src/customerAccess/customerAccessResponseEnvelope.js
```

Task586 does not create this file.

Task586 does not modify any `src/` file.

If this file is later authorized, it should only wrap already-authorized resolver / projection output. It must not:

- connect to route / controller.
- read DB.
- create DTO runtime.
- create projection service runtime.
- create API response schema runtime.

## Future Allowed Code Shape

Future conceptual helper shapes:

```text
buildCustomerAccessAllowEnvelope(input) -> envelope
buildCustomerAccessDenyEnvelope(input) -> envelope
```

or:

```text
buildCustomerAccessEnvelope(decision, projection) -> envelope
```

Task586 must not produce code.

If later authorized, the helper should be:

- deterministic.
- side-effect free.
- no DB access.
- no repository import.
- no route / controller import.
- no provider import.
- no AI / RAG import.
- no audit log write.
- no file storage access.
- no Field Service Report write.
- no appointment write.
- no publication state write.
- no customer identity write.
- no finalAppointmentId modification.
- no raw resolver internal decision in customer-visible output.

## Future Allow Envelope Exact Boundary

Future allow envelope may only carry customer-visible filtered publication view data.

Allowed concepts:

- generic success status.
- public-safe request reference.
- customer-visible service report publication data.
- customer-visible case / service metadata.
- customer-visible appointment / completion summary.
- customer-visible file / photo references only if future file policy authorizes.
- customer-visible follow-up / feedback entry only if future task authorizes.

Forbidden fields:

- internal note.
- audit log.
- AI raw payload.
- AI confidence score.
- resolver internal reason.
- permission evaluation details.
- identity match details.
- tenant mismatch details.
- internal billing / settlement data.
- vendor reconciliation data.
- engineer internal comment.
- supervisor review.
- cross-organization data.
- raw LINE id.
- token / secret.
- full unmasked phone / address unless future customer-visible policy explicitly allows.
- unpublished / draft Field Service Report content.
- completion source-data not yet published for customer view.

## Future Deny Envelope Exact Boundary

Future deny envelope must remain:

- generic unavailable / safe-deny.
- no Case existence leak.
- no customer existence leak.
- no organization mismatch leak.
- no identity mismatch leak.
- no publication-state leak.
- no permission detail leak.
- no resolver internal reason in customer-visible output.
- no customer PII.

Optional low-risk support guidance may be included, such as "please confirm the link or contact support", but it must not reveal internal evaluation details.

## Future Pseudo-field Boundary

Possible conceptual fields:

- `status`.
- `messageKey`.
- `data`.
- `error`.
- `customerVisible`.
- `requestReference`.

These names are future proposal only.

Task586 does not:

- create DTO.
- create schema.
- add localization key.
- modify controller.
- modify projection.
- add tests.

## Future Forbidden Imports / Dependencies

Even if an envelope helper is later authorized, it must not import:

- DB client / transaction helper.
- repository.
- route / controller.
- provider / LINE / SMS / Email / App push client.
- AI / RAG / vector DB client.
- billing / settlement service.
- file storage writer.
- audit log writer.
- permission runtime writer.
- customer identity writer.
- publication state writer.

## Future Minimum Acceptance Criteria

If a future task authorizes the envelope helper, minimum acceptance criteria should include:

- only one new file: `src/customerAccess/customerAccessResponseEnvelope.js`, unless separately authorized.
- exports pure envelope helper only.
- no DB imports.
- no repository imports.
- no provider imports.
- no controller imports.
- no route imports.
- allow output contains customer-visible data only.
- deny output is generic safe-deny.
- deny output does not reveal existence / mismatch / permission / publication details.
- output contains no raw phone / address / LINE id.
- output contains no internal note / audit log / AI raw payload / billing internal data.
- does not create, approve, or publish a formal Field Service Report.
- does not modify finalAppointmentId.
- does not write runtime data.

## Future Allowed Commands Draft

If future implementation is separately authorized, suggested commands:

```bash
node --check src/customerAccess/customerAccessResponseEnvelope.js
git diff --check -- src/customerAccess/customerAccessResponseEnvelope.js
```

Task586 must not run the `node --check` command above because the file does not exist and Task586 does not create it.

Task586 may only run:

```bash
git diff --check -- docs/task-586-customer-access-response-envelope-exact-implementation-packet-no-runtime-change.md
```

## Stop Conditions

Future implementation must stop and report to PM if it appears to need:

- DB access.
- repository access.
- route / controller.
- customer-facing endpoint.
- DTO / projection implementation.
- audit log write.
- provider sending.
- AI / RAG.
- migration / schema.
- package change.
- permission runtime.
- entitlement runtime.
- customer identity runtime write.
- publication state write.
- file storage access.
- billing / settlement rules.
- real customer PII.
- token / secret.
- LINE credential.
- changes outside exact authorized files.

## Mandatory Invariants

Any future response envelope work must preserve:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver / envelope cannot create, approve, or publish a formal Field Service Report.
- Resolver / envelope cannot modify completion source-data.
- Resolver / envelope cannot modify finalAppointmentId.
- LINE is not global identity.
- `organization_id + line_channel_id + line_user_id` alone is not sufficient authorization.
- Raw phone, address, or LINE id alone cannot authorize access.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.

## Next Task Candidates

Candidates only; do not execute from Task586:

- Task587 - Customer Access Resolver Pure Function Skeleton Authorization Review / No Runtime Change.
- Task588 - Customer Access Resolver Unit Test Authorization Review / No Runtime Change.
- Task589 - Customer Access Response Envelope Authorization Review / No Runtime Change.

Task586 does not start Task587.

## Non-goals

Task586 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task585 documents.

Task586 does not run:

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

Task586 remains aligned with `PROJECT_GUARDRAILS.md`:

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
