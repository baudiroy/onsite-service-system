# Task 329 - Repair Intake Import / Staging / Duplicate Detection Boundary / No Runtime Change

## Scope And Non-goals

This document follows Task328 and focuses on the controlled import path for Repair Intake.

Task329 defines docs-only boundaries for future Brand API / Excel / CSV import:

- import batch,
- import source,
- staging records,
- field mapping,
- validation,
- duplicate detection,
- completeness checks,
- dry-run preview,
- human confirmation,
- create / update candidates,
- AI-assisted mapping,
- raw import file protection.

Task329 is not:

- backend runtime,
- Admin runtime,
- API contract change,
- migration,
- schema change,
- index change,
- view change,
- DB / DDL execution,
- import runtime,
- staging runtime,
- field mapping runtime,
- validation runtime,
- duplicate detection runtime,
- dry-run preview runtime,
- Case / Customer create or update runtime,
- Customer Channel Identity runtime,
- AI-assisted import runtime,
- audit runtime,
- permission / entitlement / usage runtime,
- AI / RAG runtime,
- test / smoke / fixture change,
- package change,
- inventory documentation change.

No runtime implementation is approved by this document.

## Why This Follows Task328

Task328 established that Brand API and Excel / CSV import are controlled Repair Intake sources and must not write directly into formal Case / Customer records without validation and confirmation.

Task329 narrows that boundary into the future import pipeline so implementation cannot accidentally:

- let import data directly overwrite formal Customer / Case records,
- skip staging / draft records,
- skip duplicate detection,
- treat duplicate candidates as confirmed duplicates,
- send full raw files or payloads to external AI,
- leak sensitive row values in diagnostics,
- bypass organization scope, Data Access Control, permission, audit, or usage tracking,
- use AI as an official write authority.

## Definitions

### Import Batch

A future group of imported records received from one file, API payload, provider submission, or partner source.

The batch should track source, uploader / submitter, organization scope, status, timestamps, and safe processing summary.

### Import Source

The origin of imported data, such as Brand API, dealer API, vendor file, brand Excel, CSV export, or internal upload.

### Staging Record

A future temporary / draft row created from imported data before official Case / Customer creation or update.

Staging records should not be treated as official Case or Customer records.

### Field Mapping

The process of matching imported columns or payload keys to platform fields.

Mapping may be suggested by AI but must be confirmed by deterministic rules or human review before official writes.

### Validation Rule

A deterministic rule that checks required fields, formats, allowed values, organization scope, brand / vendor scope, and safe data constraints.

### Duplicate Detection

A future process that flags possible matches to existing Customer / Case records based on safe, normalized, organization-scoped signals.

Duplicate detection produces candidates, not final truth.

### Completeness Check

A future process that identifies missing or insufficient fields required for Case creation, first contact, or dispatch intake.

Completeness warnings do not automatically accept or reject an import row.

### Dry-run Preview

A future preview showing what would be created, updated, skipped, rejected, or sent for review before formal writes occur.

### Human Confirmation

An authorized human decision to approve, reject, correct, or defer an import action.

### Create / Update Candidate

A future candidate action proposed by import processing, such as create Case, create Customer, update Customer, attach reporter, or flag duplicate.

It is not an official write until approved and processed by authorized runtime.

### AI-assisted Mapping

AI assistance for field mapping, error summaries, cleanup suggestions, classification, or missing-field reminders.

AI-assisted mapping is advisory only and does not authorize official writes.

### Raw Import File

The original Excel, CSV, API payload, or document submitted for import.

Raw import files may contain sensitive customer data and must not be sent in full to external AI providers.

## Boundary Principles

- Brand API / Excel / CSV import must not directly create or overwrite formal Case / Customer records.
- Import must first create future staging / draft records.
- Field mapping, validation, duplicate detection, completeness check, and dry-run preview should happen before official writes.
- Human confirmation is required before future create / update Case & Customer operations when data risk or ambiguity exists.
- AI may assist mapping, error summaries, and cleanup suggestions.
- AI must not directly receive full raw sensitive import files.
- AI must not automatically overwrite official data.
- AI must not decide official duplicate truth.
- Duplicate detection candidate is not confirmed duplicate.
- Data completeness warning is not acceptance or rejection.
- Import diagnostics must not expose complete sensitive values.
- Cross-organization matching must be prohibited unless a future explicit secure design allows a constrained use case.

## Future-only Import Workflow Matrix

| Workflow stage | Source actor / system | May affect official Case / Customer? | Requires human confirmation? | Requires organization scope? | Requires Data Access Control? | Requires audit readiness? | Requires masking / redaction? | AI may assist? | AI may decide / write official data? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| File / API payload received | Partner / user / system | No | No | Yes | Yes | Yes | Yes | No | No | No |
| Import batch created | Import system | No | No | Yes | Yes | Yes | Yes | No | No | No |
| Field mapping proposed | System / AI-assisted mapping | No | Yes before official use | Yes | Yes | Yes | Yes | Yes | No | No |
| Field mapping confirmed | Authorized user / deterministic rule | No | Yes if ambiguous | Yes | Yes | Yes | Yes | Yes, advisory | No | No |
| Validation executed | Import system | No | No | Yes | Yes | Yes | Yes | No | No | No |
| Validation failed | Import system | No | Yes if override is allowed | Yes | Yes | Yes | Yes | Yes, summary only | No | No |
| Duplicate candidate detected | Import system / AI-assisted summary | No | Yes | Yes | Yes | Yes | Yes | Yes | No | No |
| Duplicate confirmed by human | Authorized user | Future-only yes, if approved workflow writes | Yes | Yes | Yes | Yes | Yes | Yes, advisory | No | No |
| Completeness warning generated | Import system / AI-assisted summary | No | Yes before official create if required fields missing | Yes | Yes | Yes | Yes | Yes | No | No |
| Dry-run preview generated | Import system | No | Yes before official write | Yes | Yes | Yes | Yes | Yes, summary only | No | No |
| Human confirmation approved | Authorized user | Future-only yes after approved runtime | Yes | Yes | Yes | Yes | Yes | Yes, advisory | No | No |
| Human confirmation rejected | Authorized user | No | Yes | Yes | Yes | Yes | Yes | Yes, advisory | No | No |
| Create Case candidate | Import system | No until executed by future approved runtime | Yes | Yes | Yes | Yes | Yes | Yes, advisory | No | No |
| Update Customer candidate | Import system | No until executed by future approved runtime | Yes | Yes | Yes | Yes | Yes | Yes, advisory | No | No |
| Case created future candidate | Future approved runtime | Future-only yes | Yes unless trusted low-risk policy | Yes | Yes | Yes | Yes | No | No | No |
| Customer updated future candidate | Future approved runtime | Future-only yes | Yes unless trusted low-risk policy | Yes | Yes | Yes | Yes | No | No | No |

All rows are future-only. `Runtime allowed now?` must remain `No` until a later task explicitly authorizes runtime scope, schema, APIs, security model, tests, and rollout controls.

## Duplicate Detection Rules

Duplicate candidate signals may include future safe, normalized, organization-scoped data such as:

- masked / normalized phone,
- normalized address,
- product type,
- product model,
- brand case id,
- vendor case id,
- serial number,
- customer channel identity,
- recent open Case with similar issue,
- same reporter / customer pair,
- same appointment or service address cluster.

Design rules:

- Duplicate candidate is not confirmed duplicate.
- Duplicate candidate must not automatically merge customer.
- Duplicate candidate must not automatically close Case.
- Duplicate candidate must not automatically overwrite Case.
- Duplicate candidate must not automatically suppress first contact.
- Cross-organization matching must be prohibited unless future work explicitly defines a secure, compliant design.
- AI must not automatically determine duplicate truth.
- Dedupe diagnostics must not reveal cross-tenant matches or sensitive matching details.
- Human confirmation is required before merge, update, close, or skip behavior unless a future low-risk deterministic rule is explicitly approved.

## Data Completeness Rules

Completeness checks may identify:

- missing customer contact path,
- missing service address,
- missing product type,
- missing issue summary,
- missing brand / vendor source reference,
- missing reporter identity,
- missing customer identity,
- missing dispatch preparation fields,
- ambiguous onsite contact,
- possible billing contact mismatch.

Design rules:

- Data completeness warning is not automatic rejection.
- Data completeness warning is not automatic acceptance.
- Some incomplete rows may still become first-contact tasks if the minimum safe data exists.
- High-risk or ambiguous rows should require human review.
- AI may summarize missing fields, but must not create official data from guesses.

## AI-assisted Import Rules

AI may assist with:

- field mapping suggestions,
- error summary,
- missing-field summary,
- duplicate-risk explanation,
- data cleanup suggestions,
- issue description classification,
- product type inference,
- routing suggestions.

AI must not:

- receive full raw import files,
- receive full raw API payloads,
- receive full raw sensitive rows,
- create official Case,
- update official Customer,
- merge duplicate records,
- close or suppress import rows,
- bypass human confirmation,
- bypass Data Access Control,
- infer official identity from uncertain data,
- turn uncertain content into official record.

AI-assisted import should use minimum necessary, masked, organization-scoped, field-level samples or summaries.

## Data Protection Rules

Raw import file / raw API payload must not be sent to external AI.

Import logs, diagnostics, dry-run preview, frontend responses, AI context, and error messages must not expose:

- complete phone values,
- complete email values,
- complete addresses beyond what is necessary and authorized,
- provider tokens,
- secrets,
- LINE access tokens,
- channel secrets,
- raw LINE identifiers,
- raw provider payloads,
- verification codes,
- complete Excel / CSV sensitive rows,
- unrestricted customer private data.

AI-assisted mapping may only use authorized, masked, organization-scoped, minimum necessary content.

Import diagnostics must not reveal whether a customer exists in another organization, whether a phone matches another tenant, or whether another organization's Case exists.

## Interaction With Existing Branches

### Repair Intake / Case Creation Source Boundary

Task329 deepens the import-specific part of Task328. It preserves the rule that all formal Case creation must converge to the same Case / Customer / Channel Identity / Contact History / Dispatch Intake flow.

### Case-created First Contact / Dispatch Intake

After a future Case is created from import, it should enter the Case-created First Contact / Dispatch Intake workflow.

### Customer Channel Identity / Notification

Imported contact information may support customer channel identity linking later, but must not create or assume raw channel identity without validation.

### Data Access Control

Import upload, staging, preview, validation, dedupe, confirmation, and future writes must use organization scope, role / permission, customer visible data policy, internal data policy, masking, audit, and usage rules.

### Audit Log / Evidence Traceability

Future import should be audit-ready for upload, mapping, validation, duplicate candidates, human confirmation, rejected rows, official writes, and source file references.

### AI / RAG Advisory-only

AI may assist import review but must not write official records, merge duplicates, or receive full raw sensitive files.

### SaaS Usage Tracking

Import batch count, row count, AI-assisted mapping, dry-run preview, and partner API usage may be usage-metered in the future.

No usage runtime is approved here.

## Explicit Runtime Forbidden Confirmation

Task329 does not allow:

- backend runtime,
- Admin runtime,
- API change,
- migration,
- schema change,
- index change,
- view change,
- DB connection,
- DDL,
- psql,
- `npm run db:migrate`,
- Migration020 dry-run or apply,
- import runtime,
- staging runtime,
- field mapping runtime,
- validation runtime,
- duplicate detection runtime,
- dry-run preview runtime,
- Case create runtime,
- Customer create runtime,
- Customer update runtime,
- Customer Channel Identity runtime,
- AI-assisted import runtime,
- audit runtime,
- permission runtime,
- entitlement runtime,
- usage runtime,
- AI / RAG runtime,
- tests / smoke / fixtures change,
- package change,
- inventory docs change.

## Non-goals

Task329 must not:

- modify backend `src/`,
- modify Admin `admin/src/`,
- add or modify API behavior,
- add or modify migrations / schema / indexes / views,
- connect to DB,
- execute DDL,
- run psql,
- run `npm run db:migrate`,
- execute Migration020 dry-run or apply,
- add import / staging / dedupe / validation runtime,
- add Case / Customer / Customer Channel Identity runtime,
- add AI-assisted import runtime,
- add notification / provider sending runtime,
- add audit / permission / entitlement / usage runtime,
- add AI / RAG runtime,
- modify tests / smoke / fixtures / package.json,
- modify inventory docs.

## Future Implementation Gates

Before any runtime work can begin, a future task must explicitly approve:

- exact backend files / layers,
- exact Admin files / layers, if any,
- API contract changes, if any,
- migration / schema / index / view changes, if any,
- DB / DDL permission, if any,
- import batch schema,
- staging record schema,
- row-level status model,
- source file storage model,
- field mapping model,
- validation rule model,
- duplicate detection policy,
- dry-run preview policy,
- human confirmation workflow,
- official create / update policy,
- AI-assisted import masking policy,
- safe error / non-enumeration policy,
- Data Access Control checks,
- audit log requirements,
- SaaS usage tracking requirements,
- test / smoke / fixture scope,
- rollback and safety plan.

## Conclusion

Task329 is docs-only Repair Intake import / staging / duplicate detection boundary guidance.

It does not approve import runtime, staging runtime, dedupe runtime, validation runtime, dry-run runtime, AI-assisted import runtime, Case / Customer runtime changes, API changes, Admin changes, DB / DDL, migrations, tests, smoke scripts, fixtures, package changes, or inventory documentation updates.
