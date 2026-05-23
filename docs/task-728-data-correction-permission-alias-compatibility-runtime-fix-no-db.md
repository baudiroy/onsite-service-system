# Task 728 — Data Correction Permission Alias Compatibility Runtime Fix / No DB

## Scope

This task fixes a bounded Data Correction route permission compatibility issue.

The Data Correction service/policy layer already accepts project-native permission aliases such as `data_correction.apply` and `data_correction.request`, while the mounted route middleware only recognized canonical permissions such as `case.correction.apply` and `case.correction.request`. That mismatch caused server-created route requests with otherwise valid alias permissions to be denied before reaching the governance service.

## Runtime Decision

- Added alias-aware permission matching in `src/dataCorrection/dataCorrectionPermissionMiddleware.js`.
- Kept existing canonical permission map unchanged.
- Added explicit alias map:
  - `data_correction.request` for request / post-departure freeze actions.
  - `data_correction.apply` for pre-departure apply.
  - `dispatch.follow_up.propose` for follow-up proposal.
- Permission context still exposes safe permission strings only.
- AI role remains denied.
- Engineer unable-to-complete still requires `appointment.result.record`.

## Guardrails

- No DB connection.
- No migration apply, dry-run, or schema/index change.
- No Admin frontend change.
- No LINE/SMS/App push/notification runtime.
- No AI/RAG/vector/provider runtime.
- No Case / Appointment / Field Service Report mutation.
- No sensitive payload logging.

## Coverage Added

- Unit coverage for alias permissions.
- Server-created Data Correction route now passes valid alias-authenticated requests.
- Engineer unable-to-complete server test now explicitly includes `appointment.result.record`.
- Mounted route tests now exercise the full permission middleware + controller chain.
- Existing safe writer coverage remains aligned with allow-listed follow-up required parts references.

## Future Task

A later task may standardize permission naming across auth seed/config/docs, but that should remain separate from this route middleware compatibility fix.
