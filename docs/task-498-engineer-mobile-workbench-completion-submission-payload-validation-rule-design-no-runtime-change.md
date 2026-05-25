# Task 498 - Engineer Mobile Workbench Completion Submission Payload Validation Rule Design

## Status

Task498 is docs-only.

It defines future completion submission payload validation rules for Engineer Mobile Workbench. It does not implement a validator, runtime behavior, tests, fixtures, database access, repository access, persistence, upload, signature capture, mobile UI, provider sending, AI, RAG, or vector database behavior.

## Current Baseline

Current Engineer Mobile Workbench runtime remains skeleton-only.

Current endpoints still return `501 Not Implemented`.

Task497 completed appointment state operation rule design.

Actual auth/session runtime remains unimplemented.

Real assignment permission runtime remains unimplemented.

Real appointment state operation runtime remains unimplemented.

Real completion submission payload validation remains unimplemented.

Task498 is docs-only and does not authorize runtime implementation.

## Payload Validation Purpose

Future completion submission payload validation should protect the system before any field input becomes draft/source data.

Validation goals:

- confirm the engineer submitted the minimum necessary field information.
- keep the engineer on-site form small and low-burden.
- reject forbidden fields before they enter downstream workflows.
- prevent the engineer client from supplying fields that must be server-owned.
- prevent photo, signature, parts, and file evidence from being treated as raw payload to store, log, or send to AI.
- preserve completion submission as future Field Service Report draft/source input only.
- keep formal Case, appointment, Field Service Report, billing, settlement, notification, survey, and AI approval decisions outside the mobile payload.

Payload validation is not permission validation. It should run with auth/session, organization scope, assignment permission, and state operation checks as separate layers in future runtime.

## Completion Submission Payload Categories

Proposal-only categories:

- appointment / dispatch visit reference.
- operation / outcome.
- completion note.
- fault reason.
- handling / resolution summary.
- parts replacement metadata.
- photo metadata references.
- signature metadata or signature exception.
- unable / pending / unavailable reason.
- engineer field note.
- minimal client metadata.
- idempotency key, as future design.

These categories are not current API fields.

## Required / Conditional / Optional Fields

Future validation should be explicit about which fields are required and why.

| Category | Required? | Condition | Notes |
| --- | --- | --- | --- |
| Appointment / dispatch visit reference | Required | All completion submission attempts | Identifies target operation, but does not prove permission. Assignment permission must be server-side. |
| Outcome | Required | All completion submission attempts | Must be one of future allowed operation outcomes. |
| Completion note | Conditional | Required for completion outcome | Short text only. Avoid long, sensitive, or unrelated narrative. |
| Fault reason | Conditional | Required when policy or case type needs fault classification | May be engineer-selected or future AI-assisted draft, but not AI-owned. |
| Handling summary | Conditional | Required for completion outcome | Should summarize what was done, not create formal FSR by itself. |
| Parts metadata | Conditional | Required when parts were used or replaced | Metadata only; does not deduct inventory or approve cost. |
| Photo metadata | Optional / policy-based | Required only when case type, exception, or evidence policy requires it | Should be future file references, not raw binary. |
| Signature metadata or exception | Conditional | Required when signature policy applies | Signature is evidence, not an absolute completion precondition. Exception reason should be structured. |
| Unable reason | Conditional | Required for unable-to-complete outcome | Should support review / follow-up without closing Case as completed. |
| Pending parts reason | Conditional | Required for pending-parts outcome | Should support future pending parts tracking and next appointment planning. |
| Customer unavailable reason | Conditional | Required for customer-unavailable outcome | Should support contact history / re-dispatch review. |
| Engineer field note | Optional | Allowed for concise field context | Must not become customer-facing report text by default. |
| Minimal client metadata | Optional | Device/app context only when useful | Must not become identity authority. |
| Idempotency key | Future recommended | Recommended for retry-prone submission flows | Not implemented in Task498. |

Validation should prefer a small set of meaningful fields over a large generic form.

## Forbidden Client-supplied Fields

Future validation should reject client-supplied fields that belong to server, admin, dispatcher, finance, customer, or system-owned workflows.

Forbidden examples:

- engineer id as authority.
- organization id as authority.
- `finalAppointmentId`.
- Case status.
- formal appointment status override.
- Field Service Report id.
- formal Field Service Report content.
- billing / settlement amount.
- quote approval.
- customer consent flag for fees.
- inventory deduction.
- provider notification flag.
- AI approval flag.
- audit actor override.
- raw token or secret.
- raw LINE / provider channel id.
- raw photo binary.
- raw signature image.
- internal note intended for customer-facing report.

The engineer client can submit field facts and metadata. It must not decide formal system authority.

## Photo / Signature / File Metadata Boundary

Photos, signatures, and attachments should use future object/file storage.

Design principles:

- completion payload should not contain raw binary.
- completion payload may contain future file reference metadata after upload is authorized and completed.
- raw photo and raw signature data should not be written to audit log.
- raw photo and raw signature data should not be included in customer-facing report by default.
- unmasked photos should not be sent to AI by default.
- signature is important evidence but not an absolute completion requirement.
- signature exception must capture a reason without over-collecting sensitive information.
- file metadata should be minimal and scoped to appointment / Case / organization through server-side validation.

Task498 does not implement upload, signature capture, file storage, metadata repository, or masking runtime.

## Parts Metadata Boundary

Engineers may later record replaced parts metadata.

Possible metadata:

- part name or selected part reference.
- quantity.
- old serial / new serial reference where policy allows.
- replacement reason.
- returned part / old part indication.
- supporting evidence reference.

Parts metadata must not:

- automatically deduct inventory.
- automatically create official stock movement.
- automatically approve cost.
- automatically decide formal settlement amount.
- overwrite parts master data.
- bypass parts / inventory / settlement review.

Service parts, inventory, vehicle stock, and settlement runtime require future PM exact scope.

AI may later help organize part numbers or suggest classification, but AI must not approve parts cost, inventory movement, or settlement amount.

## Validation Failure Behavior

Future runtime should distinguish validation failure from safe-deny.

Validation failure examples:

- malformed payload.
- missing required field.
- invalid field type.
- forbidden field present.
- conditionally required reason missing.
- text too long or unsupported attachment metadata shape.

Safe-deny examples:

- no assignment permission.
- cross-organization request.
- appointment not found.
- appointment assigned to another engineer.
- invalid or terminal appointment state discovered by server-side checks.

Safe-deny should use response equivalence and avoid resource enumeration.

Responses should not:

- expose database errors.
- expose stack traces.
- disclose internal validation policy details that enable enumeration.
- reveal whether appointment / Case / customer exists.
- log raw sensitive payload.

Validation errors may guide the engineer to fix their own form, but must stay safe and minimal.

## Idempotency And Duplicate Submission

Weak mobile networks and retries can cause duplicate submissions.

Future design should consider an idempotency key for completion submission.

Duplicate submission must not:

- create multiple formal Field Service Reports.
- repeatedly modify appointment terminal outcome.
- repeat provider sending.
- repeat AI processing.
- repeat survey trigger.
- create duplicate customer-facing reports.

Formal idempotency runtime requires future PM exact scope and likely persistence.

Task498 only records the design requirement.

## Field Service Report / Case Boundary

Completion submission payload is not formal Field Service Report completion.

It must not:

- create the formal Field Service Report.
- close the Case.
- create customer-facing report.
- trigger survey.
- trigger billing / settlement.
- trigger provider sending.
- call AI approval.
- allow engineer manual `finalAppointmentId` selection.

`finalAppointmentId` remains backend/system-owned and should be resolved from the final completed appointment according to backend completion rules.

Completion submission can be future draft/source data for authorized backend workflow only.

## Future DB / Repository Implications

Proposal only:

- payload validation can begin as pure validation.
- real persistence needs appointment repository, completion submission repository, or Field Service Report draft source data design.
- photo/signature metadata needs file storage and metadata repository.
- parts metadata may need service parts / inventory repository.
- idempotency likely needs persistence.
- audit/evidence linkage may require repository and transaction boundaries.

Any DB, repository, schema, migration, transaction, or persistence work requires future PM exact scope.

Task498 does not add repositories, query a database, or modify Migration020.

## Future Verification Needs

Proposal-only future tests:

- required field validation tests.
- conditionally required validation tests.
- forbidden field rejection tests.
- no `finalAppointmentId` accepted tests.
- no raw photo/signature tests.
- no billing/settlement field tests.
- idempotency behavior tests for future runtime.
- safe-deny vs validation error separation tests.
- no duplicate Field Service Report tests.
- no provider sending tests.
- no AI auto-approval tests.
- no Case mutation tests.
- no customer-facing report creation tests.

Task498 does not create or execute tests.

## Future Task499 Recommendation

Proposal only:

`Task499 - Engineer Mobile Workbench Completion Submission Pure Validator Skeleton / No DB / No Persistence`

Reason:

- Task498 defines validation rules.
- A future pure validator skeleton can encode forbidden fields and required field interface without DB or persistence.
- It can still avoid state mutation, formal Field Service Report creation, provider sending, and AI processing.

Task498 does not authorize Task499 implementation.

## Explicit Non-goals

Task498 does not:

- modify backend `src/`.
- modify `admin/src/`.
- add or modify routes, controllers, resolvers, guards, projections, auth boundaries, services, or repositories.
- add completion payload validator runtime.
- add appointment state runtime.
- add actual auth/session validation.
- add real permission decision.
- add assignment lookup runtime.
- add organization scope runtime.
- query a database.
- add schema / migration / index changes.
- modify Migration020.
- add fixtures / tests.
- execute tests.
- execute DB / migration / psql commands.
- execute smoke / browser / API tests.
- implement mobile UI / PWA.
- implement upload / signature / object storage.
- trigger LINE / SMS / Email / App sending.
- call AI, RAG, or vector database.
- modify package files.
- modify inventory docs.

## Completion Checklist

Task498 completion should confirm:

- modified files.
- whether only Task498 document was added.
- whether the task is docs-only.
- completion payload validation recommendation summary.
- no backend `src/` change.
- no `admin/src/` change.
- no runtime code change.
- no tests / fixtures change.
- no test execution.
- no DB / migration / Migration020 change.
- verification results.
- whether current runtime remains skeleton-only.
