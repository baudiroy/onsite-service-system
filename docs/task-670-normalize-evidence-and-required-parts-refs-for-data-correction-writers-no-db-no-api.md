# Task 670 - Normalize Evidence and Required Parts Refs for Data Correction Writers / No DB / No API

## Scope

Task670 normalizes safe evidence refs and required parts refs in the Data Correction service layer so safe metadata references can reach injected writers.

This fixes the Task669 note where service-level sanitization did not pass simple string refs through to safe writers.

## Runtime Decision

- `unableToCompleteAppointmentResultService` now accepts safe string `result.evidenceRefs` such as `photo_ref_test_001`, `evidence_ref_test_001`, and `file_ref_test_001`.
- `followUpAppointmentProposalService` now accepts safe string `proposal.requiredPartsRefs`.
- `followUpAppointmentProposalService` also supports `proposal.requiredParts` as equivalent input and normalizes it into `requiredPartsRefs`.
- Existing object ref sanitization remains available for current service behavior.
- Unsafe refs are stripped by normalization rather than forwarded to writers.

## Safety Rules

Evidence refs and required parts refs are metadata only.

Safe string refs must match the bounded reference pattern used by the safe writers. The services do not pass through:

- raw storage paths
- URLs or signed URLs
- token/secret-bearing values
- raw file paths
- raw supplier secrets or internal supplier data
- object dumps with unsafe keys

This task does not handle file upload, file download, inventory persistence, or parts inventory logic.

## Explicit Non-goals

- No route/controller/app/server change.
- No API change.
- No DB connection.
- No repository, transaction, migration, or schema change.
- No real audit/evidence/parts writer runtime.
- No file upload/download or object storage integration.
- No provider, LINE, SMS, Email, App push, notification, AI, RAG, or vector runtime.
- No admin frontend change.
- No smoke, browser, fixture, package, guardrails, short-instruction, design-doc, task-index, or README change.

## Coverage Added

The unit coverage verifies:

- Unable-to-complete with safe evidence refs passes refs to `evidenceWriter`.
- Unsafe evidence refs containing URL, signed URL, token, or raw path are stripped.
- Evidence writer payload contains only safe evidence refs.
- Unable-to-complete still does not create a Field Service Report, follow-up appointment, or `finalAppointmentId`.
- Follow-up proposal with safe required parts refs passes refs to `followUpDraftWriter`.
- Follow-up proposal supports `requiredParts` as equivalent input.
- Unsafe parts refs containing URL, token, object dump, or raw supplier data are stripped.
- Follow-up writer payload contains only safe required parts refs.
- Input objects are not mutated.
- Raw phone, address, LINE id, token, secret, DB URL, internal note, AI raw payload, and `finalAppointmentId` do not appear in output.
- Module import boundaries remain free of DB, repository, provider, and AI imports.

## Future Tasks

- Add real evidence metadata persistence only after the storage model is approved.
- Add real parts/follow-up persistence only after inventory and dispatch boundaries are approved.
- Keep file upload/download and object storage references in a separate bounded task.
- Preserve safe ref normalization when integrating real repositories.

## Verification

Planned verification commands:

- `node --check src/dataCorrection/unableToCompleteAppointmentResultService.js`
- `node --check src/dataCorrection/followUpAppointmentProposalService.js`
- `node --test tests/dataCorrection/dataCorrectionEvidenceAndPartsRefNormalization.unit.test.js`
- `git diff --check -- src/dataCorrection/unableToCompleteAppointmentResultService.js src/dataCorrection/followUpAppointmentProposalService.js tests/dataCorrection/dataCorrectionEvidenceAndPartsRefNormalization.unit.test.js docs/task-670-normalize-evidence-and-required-parts-refs-for-data-correction-writers-no-db-no-api.md`
