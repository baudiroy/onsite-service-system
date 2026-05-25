# Task 292 - Engineer Mobile Photos / Signature / Attachment Boundary Design / No Runtime Change

## Scope And Non-goals

This document continues the Engineer Mobile / Field UX docs-only branch after Task289, Task290, and Task291.

Task292 defines future-only boundaries for photos, signatures, attachments, file metadata, file visibility, file download/export, and AI file/image analysis candidates in Engineer Mobile and field-service workflows.

Task292 is documentation-only.

This task is not:

- Engineer Mobile App runtime,
- mobile web runtime,
- file upload runtime,
- object/file storage runtime,
- signature capture runtime,
- file download runtime,
- file export runtime,
- attachment permission runtime,
- report/export/download runtime,
- AI file/image analysis runtime,
- AI import runtime,
- RAG ingestion runtime,
- permission runtime,
- entitlement runtime,
- seat billing runtime,
- usage metering runtime,
- API contract change,
- Admin UI,
- backend service change,
- DB schema / migration proposal,
- smoke / test implementation.

Task292 does not add tables, migrations, schema, indexes, backend `src/`, Admin `admin/src/`, API routes, services, repositories, validators, smoke scripts, fixtures, package changes, provider sending, LINE / SMS / Email / APP sending, object storage, file storage, upload/download endpoints, AI provider calls, or inventory documentation changes.

## Why Photos / Signatures / Attachment Boundaries Are Needed After Task291

Task291 clarified that visit outcomes belong to the appointment / dispatch visit layer and must not be confused with Case closure, Field Service Report completion, quote approval, settlement approval, customer fee consent, or finalAppointmentId selection.

The next risk is treating every photo, signature, or document as a simple attachment that can be stored, viewed, downloaded, exported, or sent to AI in the same way.

Photos, customer signatures, fee evidence, quote documents, internal technician attachments, supervisor review evidence, and billing/settlement evidence have different visibility, sensitivity, audit, usage, and customer-facing rules.

Task292 defines those boundaries before any Engineer Mobile upload, signature capture, file storage, download, export, or AI file/image analysis runtime is approved.

## Definitions

### Photo Evidence

Photo evidence is an image captured or uploaded to support field-service work, such as before-service condition, after-service result, damaged part, installation evidence, or repair evidence.

Photo evidence is not a free-form public attachment. It may contain customer location, home interior, serial numbers, personal items, or other sensitive context.

### Customer Signature

Customer signature is customer confirmation or acknowledgement captured for a specific operational purpose.

Customer signature is highly sensitive evidence. It is not a general attachment and must not be treated as ordinary downloadable media.

### Attachment

Attachment is a general file reference linked to a Case, appointment / dispatch visit, Field Service Report, quote, fee consent, billing/settlement item, complaint/callback record, or future review workflow.

Attachment metadata and binary/raw content must be separated.

### Document Metadata

Document metadata is structured information about a file, such as file category, related resource, organization scope, visibility, uploader, created time, storage reference, content type, size, checksum, retention policy, masking status, audit requirement, and usage category.

Metadata should not include raw file content, complete signatures, unmasked photos, complete phone numbers, complete addresses, tokens, secrets, raw provider payloads, or raw channel identifiers.

### Object / File Storage

Object/file storage is the future storage layer for photos, signatures, documents, exports, generated reports, and large attachments.

Core business tables should store references and metadata, not binary blobs or full raw file content.

### Customer-visible File

Customer-visible file is a future file or generated document intentionally approved for customer-facing display.

Customer-visible does not mean every role can download it, every channel can see it, or the raw original can be exported without permission.

### Internal-only File

Internal-only file is a file or attachment intended only for authorized internal users or workflows.

Internal-only files must not appear in customer self-service, LINE inquiry, Web portal, App response, customer-visible report, or customer-facing AI answer.

### File Download

File download is access to the original or derived file content.

Download requires future permission, organization scope, file visibility check, masking/redaction policy, audit policy, expiration policy, and usage tracking where applicable.

### File Export

File export is inclusion of a file, link, generated document, report artifact, or file metadata in an export/report package.

Export must not bypass Data Access Control, field-level masking, customer-visible/internal-only policy, audit, or SaaS usage tracking.

### AI Image / File Analysis Candidate

AI image/file analysis candidate is a file or masked derivative that may be considered for future AI-assisted classification, missing-evidence detection, defect summary, RAG ingestion, or import analysis.

Candidate status does not mean the raw file may be sent to an external AI provider.

## Boundary Principles

- Photos, signatures, and documents should use future object/file storage, not core Case, appointment, Field Service Report, quote, fee consent, billing, settlement, or audit tables.
- Metadata and binary/raw content must be separated.
- Customer signature is sensitive evidence, not a general attachment.
- Customer-visible file does not mean all roles can download the original file.
- Internal-only file must not appear in customer-visible response, LINE inquiry, customer self-service, Web portal, App, or customer-facing AI response.
- Report, export, download, scheduled report, AI insight, and file package generation cannot bypass Data Access Control.
- File visibility must be checked independently from user permission, report/export/download permission, customer-visible policy, internal data policy, and organization scope.
- A file attached to a Case is not automatically visible to every user who can view the Case.
- A file used for billing/settlement evidence is not automatically customer-visible.
- A file used for customer fee consent is not automatically finance-exportable without policy.
- A file linked to appointment / visit history is not automatically included in the formal Field Service Report.
- AI cannot directly receive unmasked photos, full signature raw data, full address, full phone, unauthorized attachments, raw provider payloads, or cross-organization data.
- AI output about a photo, signature, or document must remain separate from official records until human review or deterministic business logic confirms it.

## Future-only File Category Matrix

This matrix is future-only guidance. It does not approve runtime, schema, storage, upload, download, export, AI analysis, or permission implementation.

| File category | Primary purpose | Customer-visible? | Engineer-visible? | Supervisor-visible? | Finance-visible? | Report/export/download eligible? | AI analysis eligible? | Requires masking/redaction? | Requires audit? | Usage tracking required? | Runtime allowed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Before-service photo | Record pre-service condition and site context. | Maybe, if approved for customer summary. | Yes, assigned scope only. | Yes, if authorized. | No by default. | Future-only restricted. | Future-only restricted. | Yes | Yes | Yes | No |
| After-service photo | Record completed service result. | Maybe, if approved for completion summary. | Yes, assigned scope only. | Yes, if authorized. | No by default. | Future-only restricted. | Future-only restricted. | Yes | Yes | Yes | No |
| Damaged part photo | Evidence of failure, damage, or replacement need. | Maybe, if safe and relevant. | Yes, assigned scope only. | Yes, if authorized. | Maybe, if settlement evidence. | Future-only restricted. | Future-only restricted. | Yes | Yes | Yes | No |
| Installation / repair evidence photo | Support installation, repair, or warranty evidence. | Maybe, if approved. | Yes, assigned scope only. | Yes, if authorized. | Maybe, if billing/settlement requires. | Future-only restricted. | Future-only restricted. | Yes | Yes | Yes | No |
| Customer signature | Customer acknowledgement or confirmation. | Maybe, only as approved confirmation display. | Maybe, only if operationally needed. | Yes, if authorized. | Maybe, if fee/settlement evidence. | Future-only highly restricted. | No by default. | Yes | Yes | Yes | No |
| Signed service confirmation | Confirm service completion or customer acknowledgement. | Maybe, approved customer copy only. | Maybe, assigned scope only. | Yes, if authorized. | Maybe, if required. | Future-only restricted. | Future-only restricted, derived text only if masked. | Yes | Yes | Yes | No |
| Quote / fee confirmation document | Support quote approval or customer fee consent. | Maybe, customer-approved copy only. | Maybe, if field workflow needs it. | Yes, if authorized. | Yes, if authorized. | Future-only restricted. | Future-only restricted, minimum necessary only. | Yes | Yes | Yes | No |
| Customer-provided document | Customer evidence, invoice, warranty, product document, or supporting file. | Maybe, customer-owned but still scoped. | Maybe, assigned scope only. | Yes, if authorized. | Maybe, if settlement requires. | Future-only restricted. | Future-only restricted, masked sample only. | Yes | Yes | Yes | No |
| Internal technician attachment | Technician internal evidence or note attachment. | No | Yes, assigned scope only. | Yes, if authorized. | No by default. | Future-only internal-only. | Future-only internal-only, masked/minimized. | Yes | Yes | Yes | No |
| Supervisor review attachment | Evidence for exception review, complaint, or risk review. | No by default. | No by default. | Yes, if authorized. | Maybe, if finance-related. | Future-only internal-only. | Future-only internal-only, masked/minimized. | Yes | Yes | Yes | No |
| Billing / settlement evidence attachment | Support reimbursement, vendor/brand settlement, fee approval, or receivable status. | No by default. | No by default. | Yes, if authorized. | Yes, if authorized. | Future-only finance-restricted. | Future-only restricted, no raw sensitive file to AI. | Yes | Yes | Yes | No |

## Data Protection Rules

Logs, errors, frontend responses, customer-visible responses, AI prompts, AI context, report samples, export samples, and smoke output must not contain:

- complete phone numbers,
- complete addresses,
- tokens,
- secrets,
- LINE access tokens,
- LINE channel secrets,
- raw LINE identifiers,
- raw provider payloads,
- signature raw data,
- unauthorized photo content,
- unmasked customer private data,
- cross-organization data,
- full internal note content,
- full billing/settlement internal data,
- AI raw sensitive payload.

Signature, photo, document download, and generated file export require future:

- organization scope check,
- user identity and role check,
- permission check,
- report/export/download permission check,
- file visibility check,
- customer-visible/internal-only policy check,
- field-level masking/redaction,
- audit log,
- download expiration policy where applicable,
- usage tracking where applicable.

Small sample report/export output must avoid single-customer or single-case sensitive inference. Even masked samples can expose sensitive facts when the sample is too narrow, unique, or operationally identifiable.

## Interaction With Existing Platform Objects

### Case

Case remains the main service request context.

Files may be linked to a Case in future metadata, but Case visibility alone must not grant access to every related file.

### Appointment / Dispatch Visit

Appointment / dispatch visit is the natural layer for visit evidence, before/after photos, damaged part photos, technician notes, and visit-specific attachments.

Visit attachments must not become formal reports by themselves.

### Field Service Report

Field Service Report remains the Case-level formal completion summary.

It may reference approved evidence or generated customer-facing summaries in the future, but it must not store raw photo/signature/document blobs in the formal report row.

### Customer Fee Consent

Customer fee consent may reference signature, quote document, call record metadata, LINE confirmation metadata, or fee confirmation evidence in the future.

Fee consent evidence must not be reduced to an internal note and must not be exposed to unauthorized roles.

### Quote

Quote workflow may reference quote documents, fee confirmation documents, customer-provided documents, or supporting photos.

Quote document visibility must follow customer-visible, internal, finance, and audit policies.

### Billing / Settlement

Billing and settlement may require evidence attachments, but finance visibility does not automatically imply customer visibility or broad export eligibility.

Billing/settlement evidence must not include unnecessary customer private data in reports or AI context.

### Complaint / Callback Future Records

Complaint and callback records may reference photos, documents, customer-provided evidence, or supervisor review attachments.

Customer complaint files may be sensitive and should follow stricter masking, audit, and visibility policies.

### AI Suggestion Records

AI suggestions may reference masked file metadata, derived labels, or human-reviewed findings.

AI suggestion records must not store raw file contents, raw signatures, unmasked photos, full addresses, full phone numbers, tokens, secrets, raw provider payloads, or unauthorized attachments.

### Report / Export / Download Future Layer

Report, export, download, and scheduled report flows must use the shared Data Access Control / Data Permission Model.

They must not use file links, signed URLs, generated reports, or export packages as a shortcut around permission, masking, audit, usage tracking, customer-visible policy, or internal data policy.

## AI / File Analysis Boundary

AI-assisted file import or file/image analysis does not mean sending the full raw file to AI.

Future external AI provider usage may only receive authorized, masked, minimized, and organization-scoped content required for a specific task.

AI may help in the future with:

- missing-evidence reminders,
- image category suggestions,
- damaged part summary drafts,
- field mapping for imported documents,
- RAG document classification,
- file metadata consistency checks,
- possible sensitive-data warning.

AI must not:

- receive unmasked photos by default,
- receive full customer signature raw data,
- receive complete customer phone or address,
- receive unauthorized attachments,
- receive cross-organization data,
- forge photo interpretation,
- forge customer signature,
- forge customer consent,
- forge engineer records,
- decide official completion result,
- approve quote,
- approve settlement,
- write official file classification without review,
- bypass human review for high-risk evidence.

AI output must remain separate from official records until a human review workflow or deterministic business rule accepts it.

## SaaS-ready / Security Considerations

Future file and attachment design must preserve:

- organization isolation,
- Field Engineer Seat boundary,
- role permission boundary,
- Data Access Control authority,
- report/export/download permission separation,
- field-level masking readiness,
- customer-visible/internal-only policy,
- audit readiness,
- storage usage tracking readiness,
- AI Add-on usage tracking readiness,
- Enterprise retention and access policy readiness,
- ISO 27001-aligned supplier and storage provider risk review.

SaaS entitlement may determine whether an organization can use photo upload, signature capture, file storage, advanced evidence management, AI file analysis, report export, or larger storage limits.

Entitlement does not replace user permission, organization scope, Data Access Control, masking, audit, or usage tracking.

## Runtime Forbidden Confirmation

Task292 explicitly does not approve:

- file upload runtime,
- object/file storage runtime,
- signature runtime,
- file download runtime,
- file export runtime,
- AI file/image analysis runtime,
- AI import runtime,
- RAG ingestion runtime,
- Engineer Mobile runtime,
- mobile web runtime,
- backend API changes,
- Admin UI changes,
- DB schema changes,
- migration changes,
- provider sending,
- LINE / SMS / Email / APP sending,
- permission runtime,
- entitlement runtime,
- usage billing runtime,
- seat billing runtime,
- smoke / fixture changes.

## Future Task Candidates

These are future candidates only and are not approved by Task292:

- file metadata schema design,
- object/file storage provider policy,
- file category and visibility matrix implementation plan,
- signature capture policy and retention design,
- signed URL / download permission design,
- evidence attachment audit event catalog,
- storage usage tracking design,
- AI file/image analysis no-raw-file policy implementation plan,
- Engineer Mobile upload UX design,
- customer-visible evidence package design.

## Conclusion

Task292 establishes docs-only boundary guidance for Engineer Mobile photos, signatures, attachments, file metadata, download/export, and AI file/image analysis candidates.

Photos, signatures, and attachments remain future design only. No runtime, API, DB, migration, Admin UI, Engineer Mobile, storage, upload/download, AI provider, report/export, permission, entitlement, usage tracking, provider sending, or inventory documentation change is approved by this task.
