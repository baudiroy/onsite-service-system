# Task 585 - Customer Access Response Envelope Proposal

## Scope

Task585 is a docs-only proposal for a future customer-facing access response envelope.

Task585 is:

- docs-only.
- no runtime.
- no `src/` changes.
- no test code changes.
- no fixture changes.
- no API.
- no DB.
- no migration.
- no provider sending.
- no AI / RAG / vector DB.

Task585 does not implement an API, route, controller, DTO, projection, resolver runtime, or test.

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
- Task582: pure function skeleton exact implementation packet completed.
- Task583: unit test plan completed.
- Task584: unit test exact implementation packet completed.

Current state:

- response envelope is only a proposal.
- no customer-facing API runtime is authorized.
- resolver runtime remains no-go.
- API, DB, migration, provider sending, and AI remain no-go.

## Future Response Envelope Purpose

A future response envelope should:

- unify customer-facing access response shape.
- support allow and deny outcomes.
- support generic safe-deny.
- carry only customer-visible service report publication views.
- avoid controllers / APIs returning resolver internal decisions directly.
- prevent customers from seeing internal reason, permission details, tenant mismatch, identity mismatch, linkage failure, or publication-state internals.

The envelope is a boundary between internal resolver decisions and customer-facing responses. It must not become an authorization engine.

## Future Allow Envelope Concept

Future allow response may conceptually include:

- stable request correlation id or public-safe reference id, if later authorized.
- generic success status.
- customer-facing service report publication view.
- customer-visible case / service metadata.
- customer-visible appointment / completion summary.
- customer-visible files / photos only if future file policy allows.
- customer-visible follow-up or feedback entry point only if future task authorizes.

Future allow response must not include:

- internal note.
- audit log.
- AI raw payload.
- AI confidence score.
- internal resolver reason.
- permission evaluation details.
- internal billing / settlement data.
- vendor reconciliation data.
- engineer internal comment.
- supervisor review.
- cross-organization data.
- raw LINE id.
- token / secret.
- complete unmasked phone / address unless future customer-visible data policy explicitly allows.

## Future Deny Envelope Concept

Future deny response must:

- use generic unavailable / safe-deny.
- not reveal whether the Case exists.
- not reveal whether the customer exists.
- not reveal organization mismatch.
- not reveal identity mismatch.
- not reveal missing binding.
- not reveal publication state internal reason.
- not expose resolver internal reason.
- not expose identity match result.
- not expose customer PII.

Future deny response may include low-risk support guidance, such as "please confirm the link or contact support", but it must not disclose internal evaluation details.

## Future Response Envelope Pseudo-fields

Possible future conceptual fields:

- `status`.
- `messageKey`.
- `data`.
- `error`.
- `customerVisible`.
- `requestReference`.

These field names are proposal-only.

Task585 does not:

- create DTO.
- modify controller.
- create projection service.
- create API response schema.
- add localization key.

## Customer-visible Data Policy Alignment

Future envelope may only carry customer-visible data.

It must not carry:

- internal note.
- audit log.
- AI raw payload.
- internal billing / settlement rules.
- vendor reconciliation data.
- engineer internal remarks.
- supervisor approval / review.
- internal task notes.
- cross-customer data.
- cross-organization data.
- unconfirmed appointment suggestion.
- unpublished or draft Field Service Report content.
- completion source-data not yet published for customer view.

The envelope should carry a filtered publication view only after a future resolver and projection layer have independently allowed access.

## Resolver Boundary Alignment

The response envelope is not the resolver.

Future envelope work must preserve:

- Resolver decision must not be directly exposed to customer.
- Deny reason must not become customer-visible.
- Envelope must not create or modify a Field Service Report.
- Envelope must not modify finalAppointmentId.
- Envelope must not decide publication allowed.
- Envelope can only wrap future already-authorized projection output.

## Stop Conditions for Future Implementation

Future response envelope implementation must stop and report to PM if it appears to need:

- route / controller.
- DTO / projection service.
- DB / repository.
- permission runtime.
- customer identity runtime.
- publication state runtime.
- audit log write.
- provider sending.
- AI / RAG.
- file storage access.
- billing / settlement rules.
- migration / schema.
- package change.
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

Candidates only; do not execute from Task585:

- Task586 - Customer Access Response Envelope Exact Implementation Packet / No Runtime Change.
- Task587 - Customer Access Resolver Pure Function Skeleton Authorization Review / No Runtime Change.
- Task588 - Customer Access Resolver Unit Test Authorization Review / No Runtime Change.

Task585 does not start Task586.

## Non-goals

Task585 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task584 documents.

Task585 does not run:

- tests.
- smoke tests.
- DB commands.
- migration commands.
- API commands.
- browser commands.
- provider sending commands.
- `node --test tests/customerAccess/customerAccessResolver.unit.test.js`.
- `node --check src/customerAccess/customerAccessResolver.js`.

## Guardrails Review

Task585 remains aligned with `PROJECT_GUARDRAILS.md`:

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
