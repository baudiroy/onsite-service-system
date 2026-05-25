# Task 601 - Customer-Facing Service Report Timeline Visibility Policy

## Scope

Task601 defines a customer-facing timeline visibility policy for future customer-facing service report, customer portal, LINE, Web link, or App inquiry flows.

Task601 is:

- docs-only.
- no runtime.
- no `src/` changes.
- no `admin/src/` changes.
- no test / fixture changes.
- no API / route / controller.
- no DTO / projection.
- no DB / migration.
- no provider sending.
- no AI / RAG.

Task601 does not authorize implementation.

## Current Context

Task574 through Task600 completed and paused the Customer Access Resolver runtime skeleton readiness branch.

Current resolver branch status remains:

```text
STATIC BASELINE CLOSED / RUNTIME SKELETON NOT AUTHORIZED / API RUNTIME NO-GO
```

Explicit exact `src/` authorization has not been granted.

This Task601 opens a new customer-facing service report product/design docs-only branch.

Task601 does not extend the conditional runtime skeleton task.

Task601 does not:

- create `src/customerAccess/customerAccessResolver.js`.
- create `resolveCustomerAccess`.
- create an API endpoint.
- create a customer-facing projection.
- create runtime behavior.

## Customer-facing Timeline Purpose

The customer-facing timeline should help customers understand the safe, confirmed, and relevant progress of their own service case.

The timeline should:

- show confirmed, customer-safe, low-risk information.
- support future LINE / Web / App inquiry entry points.
- align with customer-facing service report publication views.
- reduce customer uncertainty without exposing internal operations.
- use customer-visible wording instead of internal workflow jargon.

The timeline must not expose:

- internal dispatch ranking.
- internal review.
- permission evaluation details.
- internal cost.
- AI reasoning.
- audit details.
- unpublished Field Service Report content.

## Allowed Customer-visible Timeline States

Allowed customer-facing timeline states may include:

- repair request created.
- additional information received.
- dispatch information under confirmation.
- appointment confirmed.
- engineer arrived / service in progress.
- service completed.
- completion report available.
- waiting for customer additional information.
- waiting for customer response.
- rescheduling needed.
- customer service will contact you.
- case closed.

Future depot / workshop repair states may include, as future design only:

- item received.
- diagnosis in progress.
- pending quote confirmation.
- repair in progress.
- quality check in progress.
- repair completed.
- ready for pickup / returned by shipping.

These states are publication wording concepts, not runtime enums introduced by Task601.

## Forbidden Customer-visible Timeline Content

The customer-facing timeline must not display:

- internal note.
- audit log.
- AI raw payload.
- AI confidence score.
- internal resolver reason.
- permission evaluation details.
- organization mismatch reason.
- identity mismatch reason.
- unconfirmed dispatch suggestion.
- unconfirmed appointment suggestion.
- internal dispatch ranking.
- engineer internal comment.
- supervisor review.
- internal billing data.
- internal settlement data.
- vendor reconciliation data.
- internal cost.
- raw LINE id.
- token / secret.
- full unmasked phone or address unless a future customer-visible policy explicitly allows it.
- cross-customer data.
- cross-organization data.
- unpublished Field Service Report draft content.
- completion source-data not yet published for customer view.

## Appointment / Dispatch Visibility Rules

Customer-facing timeline visibility must preserve the existing appointment and dispatch model:

- One Case must not have multiple unfinished / open appointments at the same time.
- One Case may have multiple appointments / dispatch visits over time.
- Multi-visit history belongs to the appointment / dispatch visit layer.
- Waiting for parts, pending quote, customer not home, cancellation, unable to repair, and rescheduling are appointment / dispatch visit outcomes.
- Customer-facing wording may summarize those outcomes for customer understanding.
- Customer-facing wording must not convert each appointment into a separate formal Field Service Report.

Confirmed appointment visibility rules:

- Only confirmed appointments may be shown as customer-visible appointment information.
- Unconfirmed appointment suggestions must not be shown as official scheduled visits.
- AI `dispatch_suggestion` must not be shown as an official appointment.
- Proposed appointment windows may be shown only when clearly labeled as pending customer confirmation.
- Customer requested changes must return to a dispatch adjustment / confirmation flow.

## Field Service Report Visibility Rules

Field Service Report visibility must preserve the formal report model:

- One Case can have only one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not a second formal Field Service Report.
- Draft, unpublished, or internally reviewed Field Service Report content must not be directly displayed to customers.
- Customer-facing publication must follow customer visible data policy.
- Customer-facing publication must not include internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or vendor reconciliation rules.

Signature and completion exception visibility:

- Customer signature, representative signature, rejected signature, remote completion, or no-signature exception may be summarized in customer-safe language if future policy allows.
- The customer-facing view must not expose internal review notes or internal risk reasons.
- High-risk completion exceptions may require customer service or supervisor follow-up before publication.

Problem reporting:

- Customer reports of unresolved issues, low ratings, negative feedback, complaints, or callback requests should create follow-up / escalation.
- AI may assist with summary or classification in future design.
- AI must not hide negative feedback, close complaints, or modify ratings.

## Safe-deny / Unavailable Behavior

If a future customer access resolver decision is deny, unavailable, not published, or needs verification, the customer-facing timeline must not reveal:

- whether the Case exists.
- whether the customer exists.
- whether organization scope mismatched.
- whether identity mismatched.
- whether publication is missing.
- whether permission evaluation failed.

Customer-facing unavailable messages should be generic and safe.

Acceptable generic guidance may include:

- "Please confirm the link or contact customer service."
- "This service information is currently unavailable."
- "We could not verify access to this service information."

The response must not output raw denial reason, internal resolver reason, or permission evaluation details.

## Future Implementation Boundaries

Any future implementation requires separate explicit authorization.

Task601 does not create:

- API endpoint.
- route / controller.
- DTO / projection service.
- resolver runtime.
- response envelope helper.
- DB query.
- migration / schema.
- notification sending.
- LINE / SMS / Email / App push.
- AI summarization.
- file storage access.
- audit log runtime.
- permission runtime.

## Mandatory Invariants

Any future customer-facing timeline work must preserve:

- One Case equals one final formal Field Service Report.
- Customer-facing service report is a filtered publication view, not another formal Field Service Report.
- Resolver / envelope / timeline cannot create, approve, or publish a Field Service Report.
- Resolver / envelope / timeline cannot modify completion source-data.
- Resolver / envelope / timeline cannot modify `finalAppointmentId`.
- LINE is not global identity.
- Raw phone, address, or LINE id alone cannot authorize access.
- `organization_id + line_channel_id + line_user_id` alone is insufficient authorization.
- Cross-organization, wrong customer, unverified identity, or unlinked Case must fail closed with generic safe-deny.
- Customer-facing output cannot expose internal note, audit log, AI raw payload, internal billing / settlement data, engineer internal comment, supervisor review, or cross-organization data.

## Next Task Candidates

Candidates only; do not execute from Task601:

- Task602 - Customer-Facing Timeline Status Mapping Matrix / No Runtime Change.
- Task603 - Customer-Facing Timeline Forbidden Field Static Policy / No Runtime Change.
- Task604 - Customer-Facing Timeline Response Envelope Proposal / No Runtime Change.

Task601 does not start Task602.

## Non-goals

Task601 does not modify:

- `src/`.
- `admin/src/`.
- `tests/`.
- `fixtures/`.
- `migrations/`.
- `package.json`.
- `package-lock.json`.
- existing Task574 through Task600 documents.

Task601 does not run:

- `npm test`.
- `npm run test`.
- `npm run smoke`.
- `npm run db:migrate`.
- `psql`.
- `node --test tests/customerAccess/customerAccessResolver.unit.test.js`.
- `node --check src/customerAccess/customerAccessResolver.js`.
- `node --check src/customerAccess/customerAccessResponseEnvelope.js`.
- DB / migration / API / browser / provider sending commands.

## Task601 Allowed Verification

Task601 may only run:

```bash
git diff --check -- docs/task-601-customer-facing-service-report-timeline-visibility-policy-no-runtime-change.md
```

## Guardrails Review

Task601 remains aligned with `PROJECT_GUARDRAILS.md`:

- documentation-only.
- no runtime behavior change.
- no schema or migration change.
- no API change.
- no permission runtime change.
- no audit log runtime change.
- no smoke test change.
- no customer channel identity runtime change.
- no organization isolation runtime change.
- no SaaS entitlement, billing, usage, AI Add-on, or Enterprise SSO runtime change.
- no sensitive data, token, secret, personal data, or LINE credential touched.
